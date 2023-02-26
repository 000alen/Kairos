import threading
import functools

from collections import OrderedDict
from typing import Dict, Optional
from pydantic import BaseModel
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from tkinter import filedialog

from Kairos.notebook import Notebook
from Kairos.utils import EventEmitter, uuid


app = Flask(__name__)
CORS(app)

_notebooks: Dict[str, Notebook] = {}
_notebooks_lock = threading.Lock()

_jobs: Dict[str, OrderedDict[str, "Job"]] = {}
_jobs_lock = threading.Lock()

_emitter = EventEmitter()


class Job(BaseModel):
    id: str
    status: str
    error: bool
    output: Optional[str]


_future_job = Job(id="future", status="running", error=False, output=None)


def job(
    _func=None, notebook_id: str = None, job_id: str = None, requires_lock: bool = False
):
    @functools.wraps(_func)
    def wrapper(*args, **kwargs):
        with _jobs_lock:
            _jobs[notebook_id][job_id] = Job(
                id=job_id, status="running", error=False, output=None
            )

        if requires_lock:
            _notebooks_lock.acquire()

        error = False
        # try:
        output = _func(*args, **kwargs)
        # except Exception as e:
        #    error = True
        #    output = None

        if requires_lock:
            _notebooks_lock.release()

        with _jobs_lock:
            _jobs[notebook_id][job_id].status = "finished"
            _jobs[notebook_id][job_id].error = error
            _jobs[notebook_id][job_id].output = output

    if notebook_id not in _jobs:
        with _jobs_lock:
            _jobs[notebook_id] = OrderedDict()

    if _func is None:
        return lambda _func: job(
            _func, notebook_id=notebook_id, job_id=job_id, requires_lock=requires_lock
        )

    return threading.Thread(target=wrapper)


@app.route("/ping/<notebook_id>")
def ping(notebook_id):
    _emitter.emit(notebook_id, EventEmitter.format_sse("ping", "ping"))

    return jsonify("pong")


@app.route("/files/open")
def open_file():
    job_id = uuid()
    notebook_id = request.args.get("notebook_id")
    type = request.args.get("type")

    @job(notebook_id=notebook_id, job_id=job_id)
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
    notebook_id = request.args.get("notebook_id")
    type = request.args.get("type")

    @job(notebook_id=notebook_id, job_id=job_id)
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


@app.route("/notebooks/<notebook_id>/name")
def get_name(notebook_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        name = notebook.name

    return jsonify(name)


@app.route("/notebooks/<notebook_id>/content")
def get_content(notebook_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        content = notebook.content

    return jsonify(content)


@app.route("/notebooks/<notebook_id>/save", methods=["POST"])
def save_notebook(notebook_id):
    job_id = uuid()
    path = request.args.get("path")
    content = request.get_json()

    @job(notebook_id=notebook_id, job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        notebook.save(content, path=path)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/load")
def load_notebook():
    job_id = uuid()
    path = request.args.get("path")

    @job(notebook_id=job_id, job_id=job_id, requires_lock=True)
    def _thread():
        _notebooks[job_id] = Notebook.load(path)
        return job_id

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/run", methods=["POST"])
def notebook_run(notebook_id):
    job_id = uuid()
    prompt = request.args.get("prompt")
    content = request.get_json()

    @job(notebook_id=notebook_id, job_id=job_id, requires_lock=True)
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

    @job(notebook_id=notebook_id, job_id=job_id, requires_lock=True)
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

    @job(notebook_id=notebook_id, job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.edit(prompt, text, content=content)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/chat")
def notebook_chat(notebook_id):
    job_id = uuid()
    prompt = request.args.get("prompt")

    @job(notebook_id=notebook_id, job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.chat(prompt)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/ideas", methods=["POST"])
def get_ideas(notebook_id):
    job_id = uuid()
    content = request.get_json()

    @job(notebook_id=notebook_id, job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.ideas(content=content)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/sources")
def get_sources(notebook_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        sources = notebook.sources_to_dict()

    return jsonify(sources)


@app.route("/notebooks/<notebook_id>/sources/add")
def add_source(notebook_id):
    job_id = uuid()
    type = request.args.get("type")
    origin = request.args.get("origin")

    @job(notebook_id=notebook_id, job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.add_source(type, origin)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/sources/<source_id>")
def get_source(notebook_id, source_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        source = notebook.get_source(source_id).dict()

    return jsonify(source)


@app.route("/notebooks/<notebook_id>/sources/<source_id>/content")
def get_source_content(notebook_id, source_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        content = notebook.get_content(source_id)

    return jsonify(content)


@app.route("/notebooks/<notebook_id>/sources/<source_id>/summary")
def get_source_summary(notebook_id, source_id):
    job_id = uuid()
    last_k = request.args.get("last_k")

    @job(notebook_id=notebook_id, job_id=job_id, requires_lock=True)
    def _thread():
        notebook = _notebooks[notebook_id]
        return notebook.summary(source_id, last_k=last_k, live=True)

    _thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/live_sources")
def get_live_sources(notebook_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        live_sources = notebook.live_sources_to_dict()

    return jsonify(live_sources)


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
        live_source = notebook.get_live_source(source_id).dict()

    return jsonify(live_source)


@app.route("/notebooks/<notebook_id>/live_sources/<source_id>/summary")
def get_live_source_summary(notebook_id, source_id):
    job_id = uuid()
    last_k = request.args.get("last_k")

    @job(notebook_id=notebook_id, job_id=job_id, requires_lock=True)
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
        document = notebook.get_doc(document_id).dict()

    return jsonify(document)


@app.route("/notebooks/<notebook_id>/conversation")
def get_conversation(notebook_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        conversation = notebook.conversation_to_dict()

    return jsonify(conversation)


@app.route("/notebooks/<notebook_id>/generations")
def get_generations(notebook_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        generations = notebook.generations_to_dict()

    return jsonify(generations)


@app.route("/notebooks/<notebook_id>/jobs")
def get_jobs(notebook_id):
    with _jobs_lock:
        if notebook_id not in _jobs:
            _jobs[notebook_id] = OrderedDict()

        jobs = _jobs[notebook_id]
        jobs = [job.dict() for job in jobs.values()]

    return jsonify(jobs)


@app.route("/notebooks/<notebook_id>/jobs/<job_id>")
def get_job(notebook_id, job_id):
    with _jobs_lock:
        if job_id not in _jobs[notebook_id]:
            return jsonify(_future_job.dict())

        job = _jobs[notebook_id][job_id]
        job = job.dict()

    return jsonify(job)


@app.route("/notebooks/<notebook_id>/pca")
def get_pca(notebook_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]
        pca = notebook.pca()

    return jsonify(pca)


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
