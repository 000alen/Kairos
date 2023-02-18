import re
import json
import threading
import queue
import soundcard
import logging

from pathlib import Path
from typing import Any, List, Optional, Tuple
from dotenv import load_dotenv

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

logging.basicConfig(
    level=logging.DEBUG,
)


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


class RecorderThread(threading.Thread):
    notebook: "Notebook"
    to_transcribe_queue: queue.Queue

    _stop: threading.Event
    _loopback: Any

    def __init__(self, notebook: "Notebook", to_transcribe_queue: queue.Queue):
        super().__init__()

        logging.debug(f"Initializing recorder thread: {notebook=}")

        self.notebook = notebook
        self.to_transcribe_queue = to_transcribe_queue

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
            while True:
                if self.stopped():
                    logging.debug("Recorder thread stopped")
                    return

                data = recorder.record(
                    numframes=_sound_sample_rate * _sound_sample_length
                )
                self.to_transcribe_queue.put(data)


class TranscriberThread(threading.Thread):
    notebook: "Notebook"
    to_transcribe_queue: queue.Queue

    _stop: threading.Event
    _processor: WhisperProcessor
    _model: WhisperForConditionalGeneration

    def __init__(self, notebook: "Notebook", to_transcribe_queue: queue.Queue):
        super().__init__()

        logging.debug(f"Initializing transcriber thread: {notebook=}")

        self.notebook = notebook
        self.to_transcribe_queue = to_transcribe_queue

        self._stop = threading.Event()

        logging.debug(
            f"Initializing transcriber thread: loading model {_TRANSCRIBER_MODEL=}"
        )

        self._processor = WhisperProcessor.from_pretrained(_TRANSCRIBER_MODEL)
        self._model = WhisperForConditionalGeneration.from_pretrained(
            _TRANSCRIBER_MODEL
        )
        self._model.config.forced_decoder_ids = None

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

            data = self.to_transcribe_queue.get()

            input_features = self._processor(
                audio=data.flatten(),
                sampling_rate=_sound_sample_rate,
                return_tensors="pt",
            ).input_features

            predicted_ids = self._model.generate(input_features)

            transcription = self._processor.batch_decode(
                predicted_ids, skip_special_tokens=True
            )[0]

            doc = Document(
                page_content=transcription,
                metadata={
                    "source": "sound",
                },
            )

            logging.debug(f"Transcribed: {doc=}")

            self.notebook._add_docs([doc])


class Notebook:
    name: str
    path: Optional[str]
    sources: List[Tuple[str, str]]

    _faiss: Optional[FAISS]
    _tools: List[Tool]
    _agent: ZeroShotAgent

    _to_transcribe_queue: Optional[queue.Queue]
    _recorder_thread: Optional[RecorderThread]
    _transcriber_thread: Optional[TranscriberThread]

    def __init__(self, name: str, path: Optional[str] = None, verbose: bool = False):
        logging.debug(f"Initializing notebook: {name=}, {path=}, {verbose=}")

        self.name = name
        self.path = path

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

    def _add_docs(self, docs: List[Document]):
        logging.debug(f"Adding docs: {docs=}")

        if self._faiss is None:
            logging.debug(f"Initializing FAISS index: {_embeddings=}")
            self._faiss = FAISS.from_documents(docs, _embeddings)
        else:
            logging.debug(f"Adding docs to FAISS index: {docs=}")
            texts = [doc.page_content for doc in docs]
            metadatas = [doc.metadata for doc in docs]
            self._faiss.add_texts(texts, metadatas)

    def save(self, path: Optional[str] = None):
        logging.debug(f"Saving notebook: {path=}")

        if self.path is None and path is None:
            raise ValueError("No path specified to save notebook to.")

        if path is not None:
            self.path = path

        path = Path(self.path)

        self._faiss.save_local(self.path)

        json.dump(
            {
                "name": self.name,
                "sources": self.sources,
            },
            open(path / "notebook.json", "w"),
        )

    def add_source(self, type: str, origin: str):
        logging.debug(f"Adding source: {type=}, {origin=}")

        if type not in _SOURCE_TYPE_TO_LOADER:
            raise ValueError(f"Unknown source type {type}")

        loader = _SOURCE_TYPE_TO_LOADER[type]
        docs = loader.load(origin)
        docs = _splitter.split_documents(docs)
        self._add_docs(docs)
        self.sources.append((type, origin))

    def start_live_source(self, type: str):
        logging.debug(f"Starting live source: {type=}")

        if type != "sound":
            raise ValueError(f"Unknown live source type {type}")

        if (
            self._recorder_thread is not None
            or self._transcriber_thread is not None
            or self._to_transcribe_queue is not None
        ):
            raise ValueError("Live source already added.")

        to_transcribe_queue = queue.Queue()
        transcriber_thread = TranscriberThread(self, to_transcribe_queue)
        recorder_thread = RecorderThread(self, to_transcribe_queue)

        transcriber_thread.start()
        recorder_thread.start()

        self._to_transcribe_queue = to_transcribe_queue
        self._recorder_thread = recorder_thread
        self._transcriber_thread = transcriber_thread

    # TODO: Properly stop threads
    def stop_live_source(self, type: str):
        logging.debug(f"Stopping live source: {type=}")

        if type != "sound":
            raise ValueError(f"Unknown live source type {type}")

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

    def run(self, prompt: str) -> str:
        logging.debug(f"Running notebook: {prompt=}")

        return self._agent.run(prompt)
