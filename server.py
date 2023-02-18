import threading

from utils import uuid
from typing import Dict
from flask import Flask, request, jsonify

from notebook import Notebook


_notebooks: Dict[str, Notebook] = {}
_notebooks_lock = threading.Lock()

_jobs: Dict[str, Dict] = {}
_jobs_lock = threading.Lock()

app = Flask(__name__)


@app.route("/notebooks/create")
def create_notebook():
    name = request.args.get("name")
    path = request.args.get("path")

    id = uuid()

    with _notebooks_lock:
        _notebooks[id] = Notebook(name, path)

    return jsonify(id)


@app.route("/notebook/<notebook_id>")
def get_notebook(notebook_id):
    with _notebooks_lock:
        notebook = _notebooks[notebook_id]

    return jsonify(notebook.to_dict())


@app.route("/notebooks/<notebook_id>/save", methods=["POST"])
def save_notebook(notebook_id):
    def _thread():
        with _notebooks_lock:
            notebook = _notebooks[notebook_id]
            notebook.save(path, content)

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

    path = request.args.get("path")

    job_id = uuid()
    with _jobs_lock:
        _jobs[job_id] = {"status": "running"}

    thread = threading.Thread(target=_thread)
    thread.start()

    return jsonify(job_id)


@app.route("/notebooks/<notebook_id>/run")
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


@app.route("/notebooks/<notebook_id>/generate")
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


@app.route("/notebooks/<notebook_id>/edit")
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


@app.route("/notebooks/<notebook_id>/ideas")
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
            notebook.add_source(type, origin)

        with _jobs_lock:
            # TODO: add error handling
            _jobs[job_id]["status"] = "finished"

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
        notebook.start_live_source(type, origin)

    return jsonify(True)


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


@app.route("/events")
def get_events():
    raise NotImplementedError


@app.route("/events/<event_id>")
def get_event(event_id):
    raise NotImplementedError


if __name__ == "__main__":
    app.run(threaded=True)
