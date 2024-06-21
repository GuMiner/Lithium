import datetime
from werkzeug import exceptions
from flask import Flask, render_template, g
from flask_socketio import SocketIO, emit
from flask_compress import Compress
from pages import base

app = Flask(__name__)
base.APP = app  # Allows for blueprints to access and use the app instance.

# Must be imported later so that 'base.APP' is not None
from pages import games, projects, puzzles, recommendations

app.config['SECRET_KEY'] = {'UNUSED'}
app.config['EXPLAIN_TEMPLATE_LOADING'] = True
socketio = SocketIO(app)

Compress(app)
app.register_blueprint(games.games)
app.register_blueprint(projects.projects)
app.register_blueprint(puzzles.puzzles)
app.register_blueprint(recommendations.recommendations)

# Used by all pages for the ©️ text.
@app.context_processor
def inject_year():
    return {'year': datetime.date.today().year}

@app.errorhandler(exceptions.NotFound)
def handle_not_found(error):
    return render_template("errors/not_found.html")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/diagnostics")
def diagnostics():
    return render_template("diagnostics.html")

@socketio.on('block-sync')
def sync(message):
    print(message)
    emit('sync-result', {'data': message + ': Received'})

# Lobby socketio functions
@socketio.on('client-update')
def update_clients(message):
    emit('current-clients', { 'clients': ['a', 'b', 'c', datetime.datetime.now().second]})

if __name__ == "__main__":
    socketio.run(app)
    