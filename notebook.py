import re
import json
import threading
import queue
import soundcard
import logging
import itertools

from utils import uuid
from pathlib import Path
from typing import Any, List, Optional, Dict, Any
from dotenv import load_dotenv
from names_generator import generate_name

from langchain import LLMMathChain
from langchain.document_loaders import PagedPDFSplitter, WebBaseLoader, YoutubeLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.llms import OpenAI
from langchain.agents import initialize_agent, Tool, ZeroShotAgent
from langchain.docstore.document import Document
from transformers import WhisperProcessor, WhisperForConditionalGeneration

load_dotenv()

# logging.basicConfig(
#     level=logging.DEBUG,
# )


_AGENT = "zero-shot-react-description"

_TRANSCRIBER_MODEL = "openai/whisper-medium"

_SOURCE_TYPE_TO_LOADER = {
    "pdf": PagedPDFSplitter,
    "web": WebBaseLoader,
    "youtube": YoutubeLoader.from_youtube_url,
}

_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=256,
    chunk_overlap=0,
)

_embeddings = OpenAIEmbeddings()

_llm = OpenAI(temperature=0.3, max_tokens=-1)

_llm_math = LLMMathChain(llm=_llm)

_calculator_tool = Tool(
    name="Calculator",
    description="useful for when you need to answer questions about math",
    func=_llm_math.run,
)

_re_combine_whitespace = re.compile(r"\s+")

_sound_sample_rate = 16000

_sound_sample_length = 15


_transcriber_processor = None

_transcriber_model = None


def _load_transcriber():
    logging.debug(
        f"Initializing transcriber thread: loading model {_TRANSCRIBER_MODEL=}"
    )

    global _transcriber_processor, _transcriber_model

    _transcriber_processor = WhisperProcessor.from_pretrained(_TRANSCRIBER_MODEL)
    _transcriber_model = WhisperForConditionalGeneration.from_pretrained(
        _TRANSCRIBER_MODEL
    )
    _transcriber_model.config.forced_decoder_ids = None


# id, type, origin, ids
Source = Dict[str, Any]


# TODO: Add timestamp metadata
class RecorderThread(threading.Thread):
    notebook: "Notebook"
    to_transcribe_queue: queue.Queue
    type: str
    origin: str
    offset: int

    _stop: threading.Event
    _loopback: Any

    def __init__(
        self,
        notebook: "Notebook",
        to_transcribe_queue: queue.Queue,
        id: str,
        type: str,
        origin: str,
        offset: int = 0,
    ):
        super().__init__()

        logging.debug(f"Initializing recorder thread: {notebook=}")

        self.notebook = notebook
        self.to_transcribe_queue = to_transcribe_queue
        self.id = id
        self.type = type
        self.origin = origin
        self.offset = offset

        self._stop = threading.Event()

        # TODO: Hardcoded loopback microphone
        self._loopback = soundcard.all_microphones(
            include_loopback=True,
        )[0]

        logging.debug(f"Initialized recorder thread: {self._loopback=}")

    def stop(self):
        logging.debug("Stopping recorder thread")
        self._stop.set()

    def stopped(self):
        return self._stop.is_set()

    def run(self):
        with self._loopback.recorder(
            samplerate=_sound_sample_rate, channels=1
        ) as recorder:
            for i in itertools.count(self.offset):
                if self.stopped():
                    logging.debug("Recorder thread stopped")
                    return

                data = recorder.record(
                    numframes=_sound_sample_rate * _sound_sample_length
                )

                self.to_transcribe_queue.put({"_index": i, "data": data})


# TODO: Consider hosting this in the cloud
class TranscriberThread(threading.Thread):
    notebook: "Notebook"
    to_transcribe_queue: queue.Queue
    type: str
    origin: str

    _stop: threading.Event

    def __init__(
        self,
        notebook: "Notebook",
        to_transcribe_queue: queue.Queue,
        id: str,
        type: str,
        origin: str,
    ):
        super().__init__()

        logging.debug(f"Initializing transcriber thread: {notebook=}")

        self.notebook = notebook
        self.to_transcribe_queue = to_transcribe_queue
        self.id = id
        self.type = type
        self.origin = origin

        self._stop = threading.Event()

        if _transcriber_processor is None or _transcriber_model is None:
            _load_transcriber()

    def stop(self):
        logging.debug("Stopping transcriber thread")
        self._stop.set()

    def stopped(self):
        return self._stop.is_set()

    # TODO: Batching
    def run(self):
        while True:
            if self.stopped():
                logging.debug("Transcriber thread stopped")
                return

            item = self.to_transcribe_queue.get()
            _index = item["_index"]
            data = item["data"]

            input_features = _transcriber_processor(
                audio=data.flatten(),
                sampling_rate=_sound_sample_rate,
                return_tensors="pt",
            ).input_features

            predicted_ids = _transcriber_model.generate(input_features)

            transcription = _transcriber_processor.batch_decode(
                predicted_ids, skip_special_tokens=True
            )[0]

            doc = Document(
                page_content=transcription,
                metadata={
                    "_index": _index,
                    "type": self.type,
                    "origin": self.origin,
                },
            )

            logging.debug(f"Transcribed: {doc=}")

            ids = self.notebook._add_docs([doc])
            self.notebook.add_ids_to_live_source(self.id, ids)


class Notebook:
    name: str
    path: Optional[str]
    sources: List[Source]
    live_sources: List[Source]
    content: Any

    _faiss: Optional[FAISS]
    _tools: List[Tool]
    _agent: ZeroShotAgent

    _to_transcribe_queue: Optional[queue.Queue]
    _recorder_thread: Optional[RecorderThread]
    _transcriber_thread: Optional[TranscriberThread]

    def __init__(
        self, name: str = None, path: Optional[str] = None, verbose: bool = False
    ):
        logging.debug(f"Initializing notebook: {name=}, {path=}, {verbose=}")

        if name is None:
            name = generate_name()

        self.name = name
        self.path = path
        self.sources = []
        self.live_sources = []
        self.content = None

        self._faiss = None
        self._tools = [
            self._search_tool,
            _calculator_tool,
        ]

        logging.debug(
            f"Initializing agent: {_llm=} {self._tools=} {_AGENT=} {verbose=}"
        )
        self._agent = initialize_agent(
            llm=_llm,
            tools=self._tools,
            agent=_AGENT,
            verbose=verbose,
        )

        self._to_transcribe_queue = None
        self._recorder_thread = None
        self._transcriber_thread = None

    @classmethod
    def load(cls, path: str) -> "Notebook":
        logging.debug(f"Loading notebook: {path=}")

        _path = Path(path)
        _json = json.load(open(_path / "notebook.json", "r"))

        notebook = cls(name=_json["name"], path=path)
        notebook.sources = _json["sources"]
        notebook.live_sources = _json["live_sources"]
        notebook.content = _json["content"]

        logging.debug(f"Loading FAISS index: {path=}, {_embeddings=}")
        notebook._faiss = FAISS.load_local(path, _embeddings)

        return notebook

    @property
    def _search_tool(self) -> Tool:
        return Tool(
            name="Search",
            description="useful for when you need to find something on the internet",
            func=self._search_tool_func,
        )

    def _search_tool_func(self, query: str) -> str:
        logging.debug(f"Running search tool: {query=}")

        if self._faiss is None:
            logging.debug("No FAISS index for search tool: no source added yet")
            return "No source added yet."

        docs = self._faiss.similarity_search(query, 2)
        texts = [doc.page_content for doc in docs]
        texts = [_re_combine_whitespace.sub(" ", text).strip() for text in texts]

        logging.debug(f"Search tool results: {texts=}")

        texts = [f'"""{text}"""' for text in texts if text]
        return ", ".join(texts)

    def _add_docs(self, docs: List[Document]) -> List[str]:
        logging.debug(f"Adding docs: {docs=}")

        if self._faiss is None:
            logging.debug(f"Initializing FAISS index: {_embeddings=}")
            self._faiss = FAISS.from_documents(docs, _embeddings)
            ids = list(self._faiss.index_to_docstore_id.values())
        else:
            logging.debug(f"Adding docs to FAISS index: {docs=}")
            texts = [doc.page_content for doc in docs]
            metadatas = [doc.metadata for doc in docs]
            ids = self._faiss.add_texts(texts, metadatas)

        return ids

    def to_dict(self) -> Dict:
        logging.debug("Converting notebook to dict")

        return {
            "name": self.name,
            "sources": self.sources,
            "live_sources": self.live_sources,
            "content": self.content,
        }

    def save(self, content: Any, path: Optional[str] = None):
        logging.debug(f"Saving notebook: {path=}")

        if self.path is None and path is None:
            raise ValueError("No path specified to save notebook to.")

        if path is not None:
            self.path = path

        path = Path(self.path)

        self.content = content
        self._faiss.save_local(self.path)

        json.dump(
            self.to_dict(),
            open(path / "notebook.json", "w"),
        )

    def add_source(self, type: str, origin: str) -> str:
        logging.debug(f"Adding source: {type=}, {origin=}")

        if type not in _SOURCE_TYPE_TO_LOADER:
            raise ValueError(f"Unknown source type {type}")

        loader = _SOURCE_TYPE_TO_LOADER[type](origin)
        docs = loader.load()
        docs = _splitter.split_documents(docs)

        for i, doc in enumerate(docs):
            doc.metadata["_index"] = i

        ids = self._add_docs(docs)
        id = uuid()
        self.sources.append(
            {
                "id": id,
                "type": type,
                "origin": origin,
                "ids": ids,
            }
        )
        return id

    # TODO: Add support for multiple live sources
    def start_live_source(self, type: str, origin: str) -> str:
        logging.debug(f"Starting live source: {type=}")

        if type != "sound":
            raise ValueError(f"Unknown live source type {type}")

        if (
            self._recorder_thread is not None
            or self._transcriber_thread is not None
            or self._to_transcribe_queue is not None
        ):
            raise ValueError("Live source already added.")

        if self.has_live_source(origin):
            id = self.get_live_source_id(origin)
            offset = len(self.get_live_source(origin).ids)
        else:
            id = uuid()
            offset = 0
            self.live_sources.append(
                {
                    "id": id,
                    "type": type,
                    "origin": origin,
                    "ids": [],
                }
            )

        to_transcribe_queue = queue.Queue()
        transcriber_thread = TranscriberThread(
            self, to_transcribe_queue, id, type, origin
        )
        transcriber_thread.start()
        recorder_thread = RecorderThread(
            self, to_transcribe_queue, id, type, origin, offset
        )
        recorder_thread.start()

        self._to_transcribe_queue = to_transcribe_queue
        self._recorder_thread = recorder_thread
        self._transcriber_thread = transcriber_thread

        return id

    # TODO: Add support for multiple live sources
    def stop_live_source(self, id: str):
        logging.debug(f"Stopping live source: {id=}")

        if (
            self._recorder_thread is None
            or self._transcriber_thread is None
            or self._to_transcribe_queue is None
        ):
            raise ValueError("No live source added.")

        self._recorder_thread.stop()
        self._recorder_thread.join()

        self._transcriber_thread.stop()
        self._transcriber_thread.join()

        self._recorder_thread = None
        self._transcriber_thread = None
        self._to_transcribe_queue = None

    def get_source(self, id: str) -> Source:
        return next(source for source in self.sources if source["id"] == id)

    def get_live_source(self, id: str) -> Source:
        return next(source for source in self.live_sources if source["id"] == id)

    def has_live_source(self, origin: str) -> bool:
        return any(source["origin"] == origin for source in self.live_sources)

    def get_live_source_id(self, origin: str) -> str:
        return next(
            source["id"] for source in self.live_sources if source["origin"] == origin
        )

    def add_ids_to_live_source(self, id: str, ids: List[str]):
        logging.debug(f"Adding ids to live source: {id=}, {ids=}")

        source = self.get_live_source(id)
        source["ids"].extend(ids)

    def get_doc(self, id: str) -> Document:
        return self._faiss.docstore.search(id)

    def summary(
        self,
        id: str,
        last_k: Optional[int] = None,
        live=False,
    ) -> str:
        logging.debug(f"Generating summary: {id=}, {last_k=}")

        if live:
            source = self.get_live_source(id)
        else:
            source = self.get_source(id)
        ids = sorted(
            source["ids"],
            key=lambda doc_id: self.get_doc(doc_id).metadata["_index"],
        )

        if last_k is not None:
            ids = ids[-last_k:]

        groups = [ids[i : i + 3] for i in range(0, len(ids), 3)]
        texts = ["".join(self.get_doc(id).page_content for id in ids) for ids in groups]
        texts = [_re_combine_whitespace.sub(" ", text).strip() for text in texts]
        prompts = [
            f'Summarize the following piece of text:\n\n"""{text}"""\n\nSummary:'
            for text in texts
        ]
        _llm.max_tokens = 256
        result = _llm.generate(
            prompts,
        )
        _llm.max_tokens = -1
        summaries = [generation[0].text for generation in result.generations]

        return "\n".join(summaries).strip()

    # TODO: Consider notebook content as a source.
    def run(self, prompt: str, content: Any = None) -> str:
        logging.debug(f"Running notebook: {prompt=}")

        if content is not None:
            self.content = content

        return self._agent.run(prompt).strip()

    # TODO: Consider notebook content as a source.
    def generate(self, prompt: str, content: Any = None) -> str:
        raise NotImplementedError

    # TODO: Consider notebook content as a source.
    def edit(self, prompt: str, content: Any = None) -> str:
        raise NotImplementedError

    # TODO: Consider notebook content as a source.
    def ideas(self, content: Any = None) -> str:
        raise NotImplementedError
