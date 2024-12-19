from datetime import datetime
from dataclasses import dataclass
import json
import os
from pathlib import Path
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
        Game("traces", "/static/game/icons/traces.png", "/games/traces"),
    ]

    return render_template("games/games.html", games=game_cards)

@games.route("/blocks")
def blocks():
    return render_template("blocks.html")

@games.route("/lobby")
def lobby():
    return render_template("lobby.html")

@games.route("/traces")
def traces():
    return render_template("traces.html")

# Lobby socketio functions
@base.SOCKETIO.on('chat-client')
def sync(message):
    emit('chat-server', {'data': f"{message['name']}: {message['message']}"}, broadcast=True)
    
clients = {}

@base.SOCKETIO.on('client-update')
def update_clients(message: dict):
    
    id = message['id']

    # Name and keep-alive update
    now = datetime.now()
    client_state = { 'name': message['name'], 'lastUpdate': now, 'state': message['state'] }
    clients[id] = client_state

    # Required for inline deletion
    for id in list(clients.keys()):
        if (now - clients[id]['lastUpdate']).seconds > 5:
            del clients[id]

    current_clients = []
    for id in clients.keys():
        current_clients.append({ 'id': id, 'name': clients[id]['name'], 'state': clients[id]['state'] })
    emit('current-clients', { 'clients': current_clients })


# Redirect peer offers to the peers they are requested of.
@base.SOCKETIO.on('peer-offer')
def peer_offer(offer):
    # By default, each client is in their own room, named by session ID.
    # https://flask-socketio.readthedocs.io/en/latest/getting_started.html#rooms
    emit('peer-offer-direct', offer, to=offer['to'])

@base.SOCKETIO.on('peer-accept')
def peer_accept(offer):
    emit('peer-accept-direct', offer, to=offer['to'])

@base.SOCKETIO.on('peer-ice')
def peer_ice(offer):
    emit('peer-ice-direct', offer, to=offer['to'])

# Load the TURN server at runtime to make it more easily configurable.
script_path = os.path.abspath(os.path.dirname(__file__))
file_path = Path(os.path.join(script_path, 'turn-details.json'))
if os.path.exists(file_path):
    turn_server = json.loads(file_path.read_text())

@base.SOCKETIO.on('turn-server-request')
def turn_details():
    emit('turn-server-response', turn_server)