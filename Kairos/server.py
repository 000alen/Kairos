import threading
import queue
import functools

from typing import Dict, List, Optional
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from tkinter import filedialog

from Kairos.notebook import Notebook
from Kairos.utils import uuid


def job(_func=None, job_id: str = None, requires_lock: bool = False):
    @functools.wraps(_func)
    def wrapper(*args, **kwargs):
        with _jobs_lock:
            _jobs[job_id] = {"status": "running"}

        if requires_lock:
            _notebooks_lock.acquire()

        error = False
        try:
            output = _func(*args, **kwargs)
        except Exception as e:
            error = True
            output = None

        if requires_lock:
            _notebooks_lock.release()

        with _jobs_lock:
            _jobs[job_id]["status"] = "finished"
            _jobs[job_id]["error"] = error
            _jobs[job_id]["output"] = output

    if _func is None:
        return lambda _func: job(_func, job_id=job_id, requires_lock=requires_lock)

    return threading.Thread(target=wrapper)


class MessageEmitter:
    qs: Dict[str, List[queue.Queue]]

    def __init__(self):
        self.qs = {}

    @staticmethod
    def format_sse(data: str, event: Optional[str] = None) -> str:
        msg = f"data: {data}\n\n"
        if event is not None:
            msg = f"event: {event}\n{msg}"
        return msg

    def listen(self, id: str):
        if id not in self.qs:
            self.qs[id] = []

        q = queue.Queue(maxsize=5)
        self.qs[id].append(q)
        return q

    def emit(self, id: str, message: str):
        assert id in self.qs

        listeners = self.qs[id]

        for i in reversed(range(len(listeners))):
            try:
                listeners[i].put_nowait(message)
            except queue.Full:
                del listeners[i]


app = Flask(__name__)
CORS(app)

_notebooks: Dict[str, Notebook] = {}
_notebooks_lock = threading.Lock()

_jobs: Dict[str, Dict] = {}
_jobs_lock = threading.Lock()

_emitter = MessageEmitter()


@app.route("/ping")
def ping():
    return jsonify("pong")


@app.route("/files/open")
def open_file():
    job_id = uuid()
    type = request.args.get("type")

    @job(job_id=job_id)
    def _thread():
        return (
            filedialog.askopenfilename()
            if type == "file"
            else filedialog.askdirectory()
        )

    _thread.start()

    return jsonify(job_id)


@app.route("/files/save", methods=["POST"])
def save_file():
    job_id = uuid()
    type = request.args.get("type")

    @job(job_id=job_id)
    def _thread():
        return (
            filedialog.asksaveasfilename()
            if type == "file"
            else filedialog.askdirectory()
        )

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/create")
def create_notebook():
    notebook_id = uuid()
    name = request.args.get("name")
    path = request.args.get("path")

    with _notebooks_lock:
        _notebooks[notebook_id] = Notebook(name, path)

    return jsonify(notebook_id)


@app.route("/notebooks/<notebook_id>/rename")
def rename_notebook(notebook_id):
    name = request.args.get("name")

    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        notebook.rename(name)

    return jsonify(notebook.to_dict())


@app.route("/notebooks/<notebook_id>")
def get_notebook(notebook_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]

    return jsonify(notebook.to_dict())


@app.route("/notebooks/<notebook_id>/save", methods=["POST"])
def save_notebook(notebook_id):
    job_id = uuid()
    path = request.args.get("path")
    content = request.get_json()

    @job(job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        notebook.save(content, path=path)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/load")
def load_notebook():
    job_id = uuid()
    path = request.args.get("path")

    @job(job_id=job_id, requires_lock=True)
    def _thread():
        _notebooks[job_id] = Notebook.load(path)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/run", methods=["POST"])
def notebook_run(notebook_id):
    job_id = uuid()
    prompt = request.args.get("prompt")
    content = request.get_json()

    @job(job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.run(prompt, content=content)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/generate", methods=["POST"])
def notebook_generate(notebook_id):
    job_id = uuid()
    prompt = request.args.get("prompt")
    content = request.get_json()

    @job(job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.generate(prompt, content=content)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/edit", methods=["POST"])
def notebook_edit(notebook_id):
    job_id = uuid()
    prompt = request.args.get("prompt")
    text = request.args.get("text")
    content = request.get_json()

    @job(job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.edit(prompt, text, content=content)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/chat")
def notebook_chat(notebook_id):
    job_id = uuid()
    prompt = request.args.get("prompt")

    @job(job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.chat(prompt)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/ideas", methods=["POST"])
def get_ideas(notebook_id):
    job_id = uuid()
    content = request.get_json()

    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.ideas(content=content)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/sources/add")
def add_source(notebook_id):
    job_id = uuid()
    type = request.args.get("type")
    origin = request.args.get("origin")

    @job(job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.add_source(type, origin)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/sources/<source_id>")
def get_source(notebook_id, source_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        source = notebook.get_source(source_id)

    return jsonify(source)


@app.route("/notebooks/<notebook_id>/sources/<source_id>/summary")
def get_source_summary(notebook_id, source_id):
    job_id = uuid()
    last_k = request.args.get("last_k")

    @job(job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.summary(source_id, last_k=last_k)

    _thread.start()

    return jsonify(job_id)


# TODO: add error handling
@app.route("/notebooks/<notebook_id>/live_sources/start")
def start_live_source(notebook_id):
    type = request.args.get("type")
    origin = request.args.get("origin")

    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        id = notebook.start_live_source(type, origin)

    return jsonify(id)


@app.route("/notebooks/<notebook_id>/live_sources/running")
def get_running_live_sources(notebook_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        live_sources = notebook.running_live_sources

    return jsonify(live_sources)


# TODO: add error handling
@app.route("/notebooks/<notebook_id>/live_sources/<source_id>")
def get_live_source(notebook_id, source_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        live_source = notebook.get_live_source(source_id)

    return jsonify(live_source)


@app.route("/notebooks/<notebook_id>/live_sources/<source_id>/summary")
def get_live_source_summary(notebook_id, source_id):
    job_id = uuid()
    last_k = request.args.get("last_k")

    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.summary(source_id, last_k=last_k, live=True)

    _thread.start()

    return jsonify(job_id)


# TODO: add error handling
@app.route("/notebooks/<notebook_id>/live_sources/<source_id>/stop")
def stop_live_source(notebook_id, source_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        notebook.stop_live_source(source_id)

    return jsonify(True)


@app.route("/notebooks/<notebook_id>/documents/<document_id>")
def get_document(notebook_id, document_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        document = notebook.get_doc(document_id)

    return jsonify(document)


@app.route("/jobs/<job_id>")
def get_job(job_id):
    with _jobs_lock:
        job = _jobs[job_id]

    return jsonify(job)


@app.route("/events/<notebook_id>")
def get_events(notebook_id):
    def _stream():
        messages = _emitter.listen(notebook_id)
        while True:
            message = messages.get()
            yield message

    return Response(_stream(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(threaded=True)
