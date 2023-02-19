import threading
import queue

from utils import uuid
from typing import Dict, List, Optional
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from tkinter import filedialog

from notebook import Notebook


_notebooks: Dict[str, Notebook] = {}
_notebooks_lock = threading.Lock()

_jobs: Dict[str, Dict] = {}
_jobs_lock = threading.Lock()

app = Flask(__name__)
CORS(app)


@app.route("/files/open")
def open_file():
    def _thread():
        path = (
            filedialog.askopenfilename()
            if type == "file"
            else filedialog.askdirectory()
        )

        with _jobs_lock:
            _jobs[job_id]["status"] = "finished"
            _jobs[job_id]["output"] = path

    type = request.args.get("type")

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

    return jsonify(job_id)


@app.route("/files/save", methods=["POST"])
def save_file():
    def _thread():
        path = (
            filedialog.asksaveasfilename()
            if type == "file"
            else filedialog.askdirectory()
        )

        with _jobs_lock:
            _jobs[job_id]["status"] = "finished"
            _jobs[job_id]["output"] = path

    type = request.args.get("type")

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

    return jsonify(job_id)


@app.route("/notebooks/create")
def create_notebook():
    name = request.args.get("name")
    path = request.args.get("path")

    id = uuid()

    with _notebooks_lock:
        _notebooks[id] = Notebook(name, path)

    return jsonify(id)


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
    def _thread():
        with _notebooks_lock:
            notebook = _notebooks[notebook_id]
            notebook.save(content, path=path)

        with _jobs_lock:
            # TODO: add error handling
            _jobs[job_id]["status"] = "finished"

    path = request.args.get("path")
    content = request.get_json()

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

    return jsonify(job_id)


@app.route("/notebooks/load")
def load_notebook():
    def _thread():
        with _notebooks_lock:
            _notebooks[job_id] = Notebook.load(path)

        with _jobs_lock:
            # TODO: add error handling
            _jobs[job_id]["status"] = "finished"
            _jobs[job_id]["output"] = job_id

    path = request.args.get("path")

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/run", methods=["POST"])
def notebook_run(notebook_id):
    def _thread():
        with _notebooks_lock:
            notebook = _notebooks[notebook_id]
            output = notebook.run(prompt, content=content)

        with _jobs_lock:
            # TODO: add error handling
            _jobs[job_id]["status"] = "finished"
            _jobs[job_id]["output"] = output

    prompt = request.args.get("prompt")
    content = request.get_json()

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/generate", methods=["POST"])
def notebook_generate(notebook_id):
    def _thread():
        with _notebooks_lock:
            notebook = _notebooks[notebook_id]
            output = notebook.generate(prompt, content=content)

        with _jobs_lock:
            # TODO: add error handling
            _jobs[job_id]["status"] = "finished"
            _jobs[job_id]["output"] = output

    prompt = request.args.get("prompt")
    content = request.get_json()

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/edit", methods=["POST"])
def notebook_edit(notebook_id):
    def _thread():
        with _notebooks_lock:
            notebook = _notebooks[notebook_id]
            output = notebook.edit(prompt, text, content=content)

        with _jobs_lock:
            # TODO: add error handling
            _jobs[job_id]["status"] = "finished"
            _jobs[job_id]["output"] = output

    prompt = request.args.get("prompt")
    text = request.args.get("text")
    content = request.get_json()

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/ideas", methods=["POST"])
def get_ideas(notebook_id):
    def _thread():
        with _notebooks_lock:
            notebook = _notebooks[notebook_id]
            output = notebook.get_ideas(content=content)

        with _jobs_lock:
            # TODO: add error handling
            _jobs[job_id]["status"] = "finished"
            _jobs[job_id]["output"] = output

    content = request.get_json()

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/sources/add")
def add_source(notebook_id):
    def _thread():
        with _notebooks_lock:
            notebook = _notebooks[notebook_id]
            id = notebook.add_source(type, origin)

        with _jobs_lock:
            # TODO: add error handling
            _jobs[job_id]["status"] = "finished"
            _jobs[job_id]["output"] = id

    type = request.args.get("type")
    origin = request.args.get("origin")

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/sources/<source_id>")
def get_source(notebook_id, source_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        source = notebook.get_source(source_id)

    return jsonify(source)


@app.route("/notebooks/<notebook_id>/sources/<source_id>/summary")
def get_source_summary(notebook_id, source_id):
    def _thread():
        with _notebooks_lock:
            notebook = _notebooks[notebook_id]
            output = notebook.summary(source_id, last_k=last_k)

        with _jobs_lock:
            # TODO: add error handling
            _jobs[job_id]["status"] = "finished"
            _jobs[job_id]["output"] = output

    last_k = request.args.get("last_k")

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

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


# TODO: add error handling
@app.route("/notebooks/<notebook_id>/live_sources/<source_id>")
def get_live_source(notebook_id, source_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        live_source = notebook.get_live_source(source_id)

    return jsonify(live_source)


@app.route("/notebooks/<notebook_id>/live_sources/<source_id>/summary")
def get_live_source_summary(notebook_id, source_id):
    def _thread():
        with _notebooks_lock:
            notebook = _notebooks[notebook_id]
            output = notebook.summary(source_id, last_k=last_k, live=True)

        with _jobs_lock:
            # TODO: add error handling
            _jobs[job_id]["status"] = "finished"
            _jobs[job_id]["output"] = output

    last_k = request.args.get("last_k")

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

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


class MessageEmitter:
    qs: Dict[str, List[queue.Queue]]

    def __init__(self):
        self.qs = {}

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


_emitter = MessageEmitter()


def _format_sse(data: str, event: Optional[str] = None) -> str:
    msg = f"data: {data}\n\n"
    if event is not None:
        msg = f"event: {event}\n{msg}"
    return msg


@app.route("/ping/<notebook_id>")
def ping(notebook_id):
    message = _format_sse(notebook_id, "ping")
    _emitter.emit(notebook_id, message)
    return jsonify(True)


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
