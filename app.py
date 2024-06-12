import datetime
from werkzeug import exceptions
from flask import Flask, render_template, request, g
from flask_socketio import SocketIO, emit
from flask_compress import Compress
from pages import projects, puzzles, games

# TODO -- move move of this into separate files.
import sqlite3

app = Flask(__name__)
app.config['SECRET_KEY'] = {'UNUSED'}
socketio = SocketIO(app)

Compress(app)
app.register_blueprint(projects.projects)
app.register_blueprint(games.games)

# Used by all pages for the ©️ text.
@app.context_processor
def inject_year():
    return {'year': datetime.date.today().year}

@app.errorhandler(exceptions.NotFound)
def handle_not_found(error):
    return render_template("errors/not_found.html")

def get_puzzle_db():
    db = getattr(g, '_puzzle_data_db', None)
    if db is None:
        db = g._database = sqlite3.connect("db/puzzle-data.db")
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_puzzle_data_db', None)
    if db is not None:
        db.close()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/attributions")
def attributions():
    return render_template("attributions.html")

@app.route("/diagnostics")
def diagnostics():
    return render_template("diagnostics.html")

@app.route("/puzzles")
def puzzles_page():
    return render_template("puzzles.html")

@app.route("/puzzles/words", methods=['POST'])
def puzzles_word_query():
    query = request.form.get("wordQuery")
    anagrams = request.form.get("anagrams") is not None

    prefix = '<textarea id="resultingWords" readonly>'

    limit = 200
    if anagrams:
        words = [word[0] for word in get_puzzle_db()
                 .execute(puzzles.get_anagram_query(query), [limit])]
    else:
        words = [word[0] for word in get_puzzle_db()
                .execute(puzzles.get_word_query(), [query, limit])]

    limitText = ' (Limited!)' if len(words) == limit else ''
    postfix = f'</textarea><small>{len(words)}{limitText}</small>'
    return prefix + '\n'.join(words) + postfix

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
    