from flask import Flask, request

app = Flask(__name__)


@app.route("/notebook/create")
def create_notebook():
    name = request.args.get("name")
    path = request.args.get("path")


@app.route("/notebook/<notebook_id>")
def get_notebook(notebook_id):
    return "get notebook: " + notebook_id


@app.route("/notebook/<notebook_id>/save")
def save_notebook(notebook_id):
    path = request.args.get("path")
    content = request.get_json()


@app.route("/notebook/load")
def load_notebook():
    path = request.args.get("path")


@app.route("/notebook/<notebook_id>/run")
def notebook_run(notebook_id):
    prompt = request.args.get("prompt")
    content = request.get_json()


@app.route("/notebook/<notebook_id>/generate")
def notebook_generate(notebook_id):
    prompt = request.args.get("prompt")
    content = request.get_json()


@app.route("/notebook/<notebook_id>/edit")
def notebook_edit(notebook_id):
    prompt = request.args.get("prompt")
    text = request.args.get("text")
    content = request.get_json()


@app.route("/notebook/<notebook_id>/ideas")
def get_ideas(notebook_id):
    content = request.get_json()


@app.route("/notebook/<notebook_id>/sources/add")
def add_source(notebook_id):
    type = request.args.get("type")
    origin = request.args.get("origin")


@app.route("/notebook/<notebook_id>/sources/<source_id>")
def get_source(notebook_id, source_id):
    return "get source: " + notebook_id + " " + source_id


@app.route("/notebook/<notebook_id>/sources/<source_id>/summary")
def get_source_summary(notebook_id, source_id):
    last_k = request.args.get("last_k")


@app.route("/notebook/<notebook_id>/live_sources/start")
def start_live_source(notebook_id):
    type = request.args.get("type")


@app.route("/notebook/<notebook_id>/live_sources/<source_id>")
def get_live_source(notebook_id, source_id):
    return "get live source: " + notebook_id + " " + source_id


@app.route("/notebook/<notebook_id>/live_sources/<source_id>/summary")
def get_live_source_summary(notebook_id, source_id):
    last_k = request.args.get("last_k")


@app.route("/notebook/<notebook_id>/live_sources/<source_id>/stop")
def stop_live_source(notebook_id, source_id):
    return "stop live source: " + notebook_id + " " + source_id


@app.route("/notebook/<notebook_id>/documents/<document_id>")
def get_document(notebook_id, document_id):
    return "get document: " + notebook_id + " " + document_id


@app.route("/jobs/<job_id>")
def get_job(job_id):
    return "get job: " + job_id


@app.route("/events")
def get_events():
    return "get events"


@app.route("/events/<event_id>")
def get_event(event_id):
    return "get event: " + event_id


if __name__ == "__main__":
    app.run()
