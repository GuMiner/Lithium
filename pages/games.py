from flask import Blueprint, render_template, current_app

games = Blueprint('games', __name__, url_prefix='/games', template_folder='../templates/games')

@games.route("/")
def index():
    return render_template("games/games.html")

@games.route("/blocks")
def blocks():
    return render_template("blocks.html")

@games.route("/lobby")
def lobby():
    return render_template("lobby.html")