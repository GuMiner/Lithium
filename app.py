from flask import Flask, render_template, request, g
from flask_compress import Compress

# TODO -- move into a separate file -- blueprints
import sqlite3

app = Flask(__name__)
Compress(app)

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

@app.route("/puzzles")
def puzzles():
    return render_template("puzzles.html")

@app.route("/puzzles/words", methods=['POST'])
def puzzles_word_query():
    query = request.form.get("wordQuery")
    anagrams = request.form.get("anagrams") is not None

    prefix = '<textarea id="resultingWords" readonly>'

    limit = 200
    words = [word[0] for word in get_puzzle_db()
                .execute("SELECT word from words WHERE word LIKE ? ORDER BY word LIMIT ?", [query, limit])]

    limitText = ' (Limited!)' if len(words) == limit else ''
    postfix = f'</textarea><small>{anagrams}{len(words)}{limitText}</small>'
    return prefix + '\n'.join(words) + postfix

@app.route("/game")
def game():
    return render_template("game.html")

if __name__ == "__main__":
    app.run(debug=True)