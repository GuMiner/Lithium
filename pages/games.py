from datetime import datetime 
import json
import threading
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
    emit('chat-server', {'data': f"{message['name']}: {message['message']}"}, broadcast=True)
    
clients = {}

# Lobby socketio functions
@base.SOCKETIO.on('client-update')
def update_clients(message: dict):
    
    id = message['id']

    # Name and keep-alive update
    now = datetime.now()
    client_state = { 'name': message['name'], 'lastUpdate': now }
    clients[id] = client_state

    # Required for inline deletion
    for id in list(clients.keys()):
        if (now - clients[id]['lastUpdate']).seconds > 10:
            del clients[id]

    emit('current-clients', { 'clients': [v['name'] for v in clients.values()]})