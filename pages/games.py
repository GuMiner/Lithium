from dataclasses import dataclass
from flask import Blueprint, render_template

games = Blueprint('games', __name__, url_prefix='/games', template_folder='../templates/games')

@dataclass
class Game:
    name: str
    image: str
    link: str

@games.route("/")
def index():
    game_cards = [
        Game("blocks", "n/a", "/games/blocks"),
        Game("lobby", "n/a", "/games/lobby"),
    ]

    return render_template("games/games.html", games=game_cards)

@games.route("/blocks")
def blocks():
    return render_template("blocks.html")

@games.route("/lobby")
def lobby():
    return render_template("lobby.html")