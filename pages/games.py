import datetime
from dataclasses import dataclass
from flask import Blueprint, render_template
from flask_socketio import emit

from . import base

games = Blueprint('games', __name__, url_prefix='/games', template_folder='../templates/games')

@dataclass
class Game:
    name: str
    image: str
    link: str

@games.route("/")
def index():
    game_cards = [
        Game("blocks", "/static/game/icons/blocks.png", "/games/blocks"),
        Game("lobby", "/static/game/icons/pending.png", "/games/lobby"),
    ]

    return render_template("games/games.html", games=game_cards)

@games.route("/blocks")
def blocks():
    return render_template("blocks.html")

@games.route("/lobby")
def lobby():
    return render_template("lobby.html")

@base.SOCKETIO.on('chat-client')
def sync(message):
    emit('chat-server', {'data': message + ': Received'}, broadcast=True)
    
# Lobby socketio functions
@base.SOCKETIO.on('client-update')
def update_clients(message):
    emit('current-clients', { 'clients': ['a', 'b', 'c', datetime.datetime.now().second]})