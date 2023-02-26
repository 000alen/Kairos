import os
import re
import json
import threading
import queue
import soundcard
import logging
import itertools
import numpy

from sklearn.manifold import TSNE
from pathlib import Path
from typing import Any, List, Optional, Dict, Any
from dotenv import load_dotenv
from names_generator import generate_name
from tkinter import filedialog
from pydantic import BaseModel
from langchain import LLMMathChain
from langchain.document_loaders import PagedPDFSplitter, WebBaseLoader, YoutubeLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.llms import OpenAI
from langchain.agents import initialize_agent, Tool, ZeroShotAgent, ConversationalAgent
from langchain.docstore.document import Document
from langchain.serpapi import SerpAPIWrapper
from langchain.utilities.wolfram_alpha import WolframAlphaAPIWrapper
from langchain.chains.conversation.memory import ConversationBufferMemory
from transformers import WhisperProcessor, WhisperForConditionalGeneration

from Kairos.utils import uuid, EventEmitter

load_dotenv()

# logging.basicConfig(
#     level=logging.DEBUG,
# )


_AGENT = "zero-shot-react-description"
_CONVERSATIONAL_AGENT = "conversational-react-description"

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

_google_tool = Tool(
    name="Google",
    description="A search engine for the internet. Should only be used if the search engine for the . Useful for when you need to answer questions about current events. Input should be a search query.",
    func=SerpAPIWrapper().run,
    coroutine=SerpAPIWrapper().arun,
)

_wolfram_tool = Tool(
    name="Wolfram Alpha",
    description="A wrapper around Wolfram Alpha. Useful for when you need to answer questions about Math, Science, Technology, Culture, Society and Everyday Life. Input should be a search query.",
    func=WolframAlphaAPIWrapper().run,
)

_RE_COMBINE_WHITESPACE = re.compile(r"\s+")

_SOUND_SAMPLE_RATE = 16000

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


class Source(BaseModel):
    id: str
    type: str
    origin: str
    ids: List[str]


class Message(BaseModel):
    id: str
    sender: str
    text: str


class Action(BaseModel):
    tool: str
    tool_input: str
    log: str


class Step(BaseModel):
    action: Action
    result: str


class Generation(BaseModel):
    id: str
    type: str
    input: str
    output: str
    intermediate_steps: Optional[List[Step]]


class RecorderThread(threading.Thread):
    notebook: "Notebook"
    to_transcribe_queue: queue.Queue
    type: str
    origin: str
    offset: int

    _chunk_size: int
    _chunk_overlap: int
    _temperature: float
    _sound_sample_length: int
    _k: int

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
            samplerate=_SOUND_SAMPLE_RATE, channels=1
        ) as recorder:
            for i in itertools.count(self.offset):
                if self.stopped():
                    logging.debug("Recorder thread stopped")
                    return

                data = recorder.record(
                    numframes=_SOUND_SAMPLE_RATE * _sound_sample_length
                )

                self.to_transcribe_queue.put(
                    {
                        "id": self.id,
                        "type": self.type,
                        "origin": self.origin,
                        "_index": i,
                        "data": data,
                    }
                )


# TODO: Consider hosting this in the cloud
class TranscriberThread(threading.Thread):
    notebook: "Notebook"
    to_transcribe_queue: queue.Queue

    _stop: threading.Event

    def __init__(
        self,
        notebook: "Notebook",
        to_transcribe_queue: queue.Queue,
    ):
        super().__init__()

        logging.debug(f"Initializing transcriber thread: {notebook=}")

        self.notebook = notebook
        self.to_transcribe_queue = to_transcribe_queue

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
            id = item["id"]
            type = item["type"]
            origin = item["origin"]
            _index = item["_index"]
            data = item["data"]

            input_features = _transcriber_processor(
                audio=data.flatten(),
                sampling_rate=_SOUND_SAMPLE_RATE,
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
                    "type": type,
                    "origin": origin,
                },
            )

            logging.debug(f"Transcribed: {doc=}")

            ids = self.notebook._add_docs([doc])
            self.notebook.add_ids_to_live_source(id, ids)


# TODO: Implement
class IntelligenceThread(threading.Thread):
    notebook: "Notebook"
    events: queue.Queue

    _stop: threading.Event

    def __init__(self, notebook: "Notebook", events: queue.Queue):
        super().__init__()

        self.notebook = notebook
        self.events = events

        self._stop = threading.Event()

    def stop(self):
        logging.debug("Stopping transcriber thread")
        self._stop.set()

    def stopped(self):
        return self._stop.is_set()

    def run(self):
        pass


class Notebook:
    name: str
    path: Optional[str]
    sources: List[Source]
    live_sources: List[Source]
    conversation: List[Message]
    content: Any
    generations: List[Generation]

    _transcriber_thread: Optional[TranscriberThread]
    _to_transcribe_queue: Optional[queue.Queue]

    _live_sources_threads: Dict[str, RecorderThread]

    _faiss: Optional[FAISS]
    _tools: List[Tool]
    _agent: ZeroShotAgent

    _conversational_memory: ConversationBufferMemory
    _conversational_agent: ConversationalAgent

    _emitter: EventEmitter

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
        self.conversation = []
        self.content = None
        self.generations = []

        self._faiss = None
        self._tools = [self._search_tool, _calculator_tool, _google_tool, _wolfram_tool]

        logging.debug(
            f"Initializing agent: {_llm=} {self._tools=} {_AGENT=} {verbose=}"
        )
        self._agent = initialize_agent(
            llm=_llm,
            tools=self._tools,
            agent=_AGENT,
            verbose=verbose,
        )
        self._agent.return_intermediate_steps = True

        logging.debug(
            f"Initializing conversational agent: {_llm=} {self._tools=} {_CONVERSATIONAL_AGENT=} {verbose=}"
        )
        self._conversational_memory = ConversationBufferMemory(
            memory_key="chat_history"
        )
        self._conversational_agent = initialize_agent(
            llm=_llm,
            tools=self._tools,
            agent=_CONVERSATIONAL_AGENT,
            verbose=verbose,
            memory=self._conversational_memory,
        )

        self._to_transcribe_queue = None
        self._transcriber_thread = None

        self._live_sources_threads = {}

        self._emitter = EventEmitter()

        self._intelligence_thread = None
        self._ensure_intelligence()

    @classmethod
    def load(cls, path: Optional[str] = None) -> "Notebook":
        logging.debug(f"Loading notebook: {path=}")

        if path is None:
            path = filedialog.askdirectory()

        if not path:
            raise ValueError("No path provided")

        _path = Path(path)
        _json = json.load(open(_path / "notebook.json", "r"))

        notebook = cls(name=_json["name"], path=path)
        notebook.sources = [Source(**source) for source in _json["sources"]]
        notebook.live_sources = [Source(**source) for source in _json["live_sources"]]
        notebook.conversation = [
            Message(**message) for message in _json["conversation"]
        ]
        notebook.content = _json["content"]
        notebook.generations = [
            Generation(
                id=generation["id"],
                type=generation["type"],
                input=generation["input"],
                output=generation["output"],
                intermediate_steps=[
                    Step(action=Action(**step["action"]), result=step["result"])
                    for step in generation["intermediate_steps"]
                ],
            )
            for generation in _json["generations"]
        ]

        logging.debug(f"Loading FAISS index: {path=}, {_embeddings=}")

        if os.path.exists(_path / "index.faiss"):
            notebook._faiss = FAISS.load_local(path, _embeddings)

        return notebook

    @property
    def _search_tool(self) -> Tool:
        return Tool(
            name="Search",
            description="A search engine for the relevant knowledge database. Use this tool before using Google. Search for a topic and get the most relevant documents. Input should be a search query.",
            func=self._search_tool_func,
        )

    @property
    def running_live_sources(self) -> List[str]:
        return list(self._live_sources_threads.keys())

    def _ensure_intelligence(self):
        if self._intelligence_thread is None:
            self._intelligence_thread = IntelligenceThread(self, self._emitter)
            self._intelligence_thread.start()

    def _ensure_transcriber(self):
        if self._to_transcribe_queue is None:
            self._to_transcribe_queue = queue.Queue()

        if self._transcriber_thread is None:
            self._transcriber_thread = TranscriberThread(
                self, self._to_transcribe_queue
            )
            self._transcriber_thread.start()

    def _stop_transcriber(self):
        if self._transcriber_thread is not None:
            self._transcriber_thread.stop()
            self._transcriber_thread = None
            self._to_transcribe_queue = None

    def _search_tool_func(self, query: str) -> str:
        logging.debug(f"Running search tool: {query=}")

        if self._faiss is None:
            logging.debug("No FAISS index for search tool: no source added yet")
            return "No source added yet."

        docs = self._faiss.similarity_search(query, 2)
        texts = [doc.page_content for doc in docs]
        texts = [_RE_COMBINE_WHITESPACE.sub(" ", text).strip() for text in texts]

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
            "sources": self.sources_to_dict(),
            "live_sources": self.live_sources_to_dict(),
            "conversation": self.conversation_to_dict(),
            "content": self.content,
            "generations": self.generations_to_dict(),
        }

    def sources_to_dict(self) -> Dict:
        return [source.dict() for source in self.sources]

    def live_sources_to_dict(self) -> Dict:
        return [source.dict() for source in self.live_sources]

    def conversation_to_dict(self) -> Dict:
        return [message.dict() for message in self.conversation]

    def generations_to_dict(self) -> Dict:
        return [generation.dict() for generation in self.generations]

    def save(self, content: Any, path: Optional[str] = None):
        logging.debug(f"Saving notebook: {path=}")

        if self.path is None and path is None:
            path = filedialog.askdirectory()

        if self.path is None and path is None:
            raise ValueError("No path specified to save notebook to.")

        if path is not None:
            self.path = path

        path = Path(self.path)

        self.content = content

        if self._faiss is not None:
            logging.debug(f"Saving FAISS index: {path=}")
            self._faiss.save_local(self.path)

        json.dump(
            self.to_dict(),
            open(path / "notebook.json", "w"),
        )

    def rename(self, name: str):
        logging.debug(f"Renaming notebook: {name=}")

        self.name = name

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
            Source(
                id=id,
                type=type,
                origin=origin,
                ids=ids,
            )
        )
        return id

    # TODO: Add support for different types of live sources
    def start_live_source(self, type: str, origin: str) -> str:
        logging.debug(f"Starting live source: {type=}")

        if type != "sound":
            raise ValueError(f"Unknown live source type {type}")

        if self.has_live_source(origin):
            id = self.get_live_source_id(origin)
            offset = len(self.get_live_source(origin).ids)
        else:
            id = uuid()
            offset = 0

        if id in self._live_sources_threads:
            raise ValueError(f"Live source {id} is already running")

        if not self.has_live_source(origin):
            self.live_sources.append(
                Source(
                    id=id,
                    type=type,
                    origin=origin,
                    ids=[],
                )
            )

        self._ensure_transcriber()

        thread = RecorderThread(
            self, self._to_transcribe_queue, id, type, origin, offset
        )
        thread.start()

        self._live_sources_threads[id] = thread

        return id

    def stop_live_source(self, id: str):
        logging.debug(f"Stopping live source: {id=}")

        if id not in self._live_sources_threads:
            raise ValueError(f"Live source {id} is not running")

        thread = self._live_sources_threads[id]
        thread.stop()

        del self._live_sources_threads[id]

        if not self._live_sources_threads:
            self._stop_transcriber()

    def get_source(self, id: str) -> Source:
        try:
            return next(source for source in self.sources if source.id == id)
        except StopIteration:
            return None

    def get_live_source(self, id: str) -> Source:
        try:
            return next(source for source in self.live_sources if source.id == id)
        except StopIteration:
            return None

    def has_live_source(self, origin: str) -> bool:
        try:
            return any(source.origin == origin for source in self.live_sources)
        except StopIteration:
            return False

    def get_live_source_id(self, origin: str) -> str:
        return next(
            source.id for source in self.live_sources if source.origin == origin
        )

    def add_ids_to_live_source(self, id: str, ids: List[str]):
        logging.debug(f"Adding ids to live source: {id=}, {ids=}")

        source = self.get_live_source(id)
        source.ids.extend(ids)

    def get_doc(self, id: str) -> Document:
        return self._faiss.docstore.search(id)

    def get_content(self, id: str, live=False, last_k: Optional[int] = None) -> str:
        if live:
            source = self.get_live_source(id)
        else:
            source = self.get_source(id)
        ids = sorted(
            source.ids,
            key=lambda doc_id: self.get_doc(doc_id).metadata["_index"],
        )

        if last_k is not None:
            ids = ids[-last_k:]

        docs = [self.get_doc(id) for id in ids]
        texts = [doc.page_content for doc in docs]
        texts = [_RE_COMBINE_WHITESPACE.sub(" ", text).strip() for text in texts]
        return " ".join(texts)

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
            source.ids,
            key=lambda doc_id: self.get_doc(doc_id).metadata["_index"],
        )

        if last_k is not None:
            ids = ids[-last_k:]

        groups = [ids[i : i + 3] for i in range(0, len(ids), 3)]
        texts = ["".join(self.get_doc(id).page_content for id in ids) for ids in groups]
        texts = [_RE_COMBINE_WHITESPACE.sub(" ", text).strip() for text in texts]
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

        response = "\n".join(summaries).strip()

        self.generations.append(
            Generation(
                id=uuid(),
                type="run",
                input="\n".join(texts),
                output=response,
            )
        )

        return response

    def _format_generation(
        self, type: str, response: Dict, id: Optional[str] = None
    ) -> Generation:
        if id is None:
            id = uuid()

        return Generation(
            id=id,
            type=type,
            input=response["input"].strip(),
            output=response["output"].strip(),
            intermediate_steps=[
                Step(action=Action(**action._asdict()), result=result)
                for action, result in response["intermediate_steps"]
            ],
        )

    # TODO: Consider notebook content as a source.
    def run(self, prompt: str, content: str = None) -> str:
        logging.debug(f"Running notebook: {prompt=}")

        if content is not None:
            self.content = content

        response = self._agent(prompt)
        generation = self._format_generation("run", response)
        self.generations.append(generation)

        return generation.output

    # TODO: Consider notebook content as a source.
    def generate(self, prompt: str, content: str = None) -> str:
        raise NotImplementedError

    # TODO: Consider notebook content as a source.
    def edit(self, prompt: str, content: str = None) -> str:
        raise NotImplementedError

    # TODO: Consider notebook content as a source.
    def ideas(self, content: str = None) -> str:
        texts = _splitter.split_text(content)
        texts = [texts[i : i + 3] for i in range(0, len(texts), 3)]
        texts = ["".join(text) for text in texts]
        texts = [_RE_COMBINE_WHITESPACE.sub(" ", text).strip() for text in texts]
        prompts = [
            f'Identify one possible idea you could write about to keep expanding this document: """{text}"""'
            for text in texts
        ]
        self._agent.return_intermediate_steps = False
        responses = self._agent.run(prompts)
        self._agent.return_intermediate_steps = True

        if type(responses) is not list:
            responses = [responses]

        self.generations.append(
            Generation(
                id=uuid(),
                type="ideas",
                input=content,
                output="\n".join(responses),
            )
        )

        return responses

    # TODO: Consider notebook content as a source.
    def chat(self, prompt: str) -> str:
        logging.debug(f"Running chat: {prompt=}")

        self.conversation.append(
            Message(
                id=uuid(),
                sender="Human",
                text=prompt,
            )
        )

        response = self._conversational_agent.run(prompt).strip()

        self.conversation.append(
            Message(
                id=uuid(),
                sender="AI",
                text=response,
            )
        )

        self.generations.append(
            Generation(
                id=uuid(),
                type="chat",
                input=prompt,
                output=response,
            )
        )

        return response

    def pca(self):
        docstore_id_to_index = {
            docstore_id: index
            for index, docstore_id in self._faiss.index_to_docstore_id.items()
        }

        embeddings = []
        texts = []
        for source in self.sources:
            for id in source.ids:
                embeddings.append(
                    self._faiss.index.reconstruct(docstore_id_to_index[id])
                )
                texts.append(self.get_doc(id).page_content)

        matrix = numpy.array(embeddings)

        tsne = TSNE(
            n_components=2,
            perplexity=15,
            random_state=42,
            init="random",
            learning_rate=200,
        )

        xy = tsne.fit_transform(matrix).tolist()
        xyt = [[x, y, text] for (x, y), text in zip(xy, texts)]

        return xyt
