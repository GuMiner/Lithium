import { Socket, io } from "socket.io-client";

// Connect to the server, setting the session ID and getting the TURN server details.
const socket: Socket = io();

var sessionId = '';
socket.on("connect", () => {
    console.log(socket.id);
    sessionId = socket.id;

    socket.emit('turn-server-request');
});

var servers: RTCConfiguration;
socket.on('turn-server-response', (server) => {
    servers = {
        iceServers: [
            server   
        ]
    };
});

var localStream: MediaStream = null;

// Cache the user name to avoid retyping it.
var userName = window.localStorage.getItem("chatUserName");
(document.getElementById('userName') as HTMLInputElement).value = userName;

// Update list of any connected clients, also uploading the name and ready state
setInterval(function() {
    if (socket.connected) {
        const name = (document.getElementById('userName') as HTMLInputElement).value;
        if (name != userName) {
            userName = name;
            window.localStorage.setItem("chatUserName", name);
        }
        socket.emit('client-update', { id: sessionId, name: name, ready: localStream != null });
    }
}, 1000);

interface Client {
    id: string,
    name: string,
    ready: boolean
}

interface CurrentClients {
    clients: Client[]
}

var lastKnownClients: Client[] = null;
socket.on('current-clients', (data: CurrentClients) => {
    var prefix = '<ul>';
    var suffix = '</ul>';
    let clients = '';

    lastKnownClients = data.clients;
    for (const client of data.clients) {
        var nameSuffix = client.id == sessionId ? '(you)' : ''
        var videoStatus = client.ready ? ' <b>Ready for video!</b>' : ''
        clients += `<li>${client.name} <small>(${client.id}) <i>${nameSuffix}</i></small>${videoStatus}</li>`        
    }
    
    if (clients == '') {
        clients += `<li>No active clients</li>`
    }
    document.getElementById('currentClients').innerHTML = `${prefix}${clients}${suffix}`;
});

// Handle basic ephemeral chatting
document.getElementById('chatForm').onsubmit = e => {
    e.preventDefault();
    const chatEntry = document.getElementById('chatEntry') as HTMLInputElement;

    socket.emit('chat-client', {name: userName, message: chatEntry.value});
    chatEntry.value = '';
}

socket.on('chat-server', (data) => {
    console.log(`Received: {data.data}`);
    document.getElementById('chatResponse').innerHTML += `<br/>${data.data}`
});

async function playVideoFromCamera(): Promise<MediaStream> {
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    // You can specify more constraints, but the defaults are good enough for my use case
    const constraints = {
        'video': true,
        'audio': true};    
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Ensure that we don't loop back the microphone locally to ourselves, causing feedback.
    var videoOnlyStream = mediaStream.clone();
    videoOnlyStream.removeTrack(videoOnlyStream.getAudioTracks()[0]);

    document.getElementById("localVideos")
        .innerHTML += `<video id="localVideo" class="video-insert" autoplay playsinline></video>`

    // Ensure that the inline frame resizes to match the video resolution
    var localVideo = (document.getElementById("localVideo") as HTMLVideoElement);
    localVideo.srcObject = videoOnlyStream;
    
    // Unhide the rest of the UI
    document.getElementById('waitForCamera').removeAttribute('style');
    return mediaStream;
}

class Peer
{
    peerConnection: RTCPeerConnection;
    remoteId: string;

    constructor(localStream: MediaStream, clientId: string) {
        this.peerConnection = new RTCPeerConnection(servers);
        this.remoteId = clientId;

        document.getElementById("remoteVideos")
            .innerHTML += `<video id="remoteVideo-${this.remoteId}" class="video-insert" autoplay playsinline></video>`

        // Ensure that if a remote webcam is received, it is displayed appropriately.
        this.peerConnection.ontrack = (trackEvent) => {
            console.log(`Received remote stream from ${clientId}`);
            var videoElement = document.getElementById(`remoteVideo-${this.remoteId}`) as HTMLVideoElement;
            if (videoElement.srcObject !== trackEvent.streams[0]) {
                videoElement.srcObject = trackEvent.streams[0];
            }
        }

        // Ensure that all ICE candidates are sent to the remote server
        this.peerConnection.onicecandidate = iceEvent => {
            if (iceEvent.candidate) {
                console.log(`Sending ICE candidate to ${this.remoteId}`);
                socket.emit('peer-ice', { to: this.remoteId, from: sessionId, 
                    candidate: iceEvent.candidate.candidate,
                    sdpMid: iceEvent.candidate.sdpMid,
                    sdpMLineIndex: iceEvent.candidate.sdpMLineIndex });
            }
          };

        // Send the local webcam to the remote server
        var peerStream = localStream.clone();
        const audioTracks = peerStream.getAudioTracks();
        const videoTracks = peerStream.getVideoTracks();
        if (audioTracks.length > 0) {
            console.log(`Using audio device: ${audioTracks[0].label}`);
        }
        if (videoTracks.length > 0) {
            console.log(`Using video device: ${videoTracks[0].label}`);
        }

        peerStream.getTracks().forEach(track => this.peerConnection.addTrack(track, peerStream));
    }
};

var peers: { [id: string]: Peer; } = {};

async function createAndSendPeerOfferIfMissing(client: Client) {
    if (client.ready && !(client.id in peers)) {
        var peer = new Peer(localStream, client.id);
        peers[client.id] = peer;
        await sendPeerOffer(peer);
    }
}

var connectTriggered: boolean = false;
async function connectToReadyPeers() {
    // Add new peers that are missing
    for (const client of lastKnownClients) {
        if (client.id == sessionId) {
            // Skip the current user
            continue;
        }
        
        await createAndSendPeerOfferIfMissing(client);
    }

    // Remove dead peers that no longer are present
    for (const peerId in peers) {
        var foundClient = false;
        for (const client of lastKnownClients) {
            if (client.id == peerId) {
                foundClient = true;
                break;
            }
        }

        if (!foundClient) {
            delete peers[peerId];
            document.getElementById(`remoteVideo-${peerId}`).remove();
        }
    }
}

function connect() {
    connectTriggered = true;
    setInterval(connectToReadyPeers, 1000);
}

async function sendPeerOffer(peer: Peer) {
    var offer = await peer.peerConnection.createOffer();
    await peer.peerConnection.setLocalDescription(offer);
    socket.emit('peer-offer', { to: peer.remoteId, from: sessionId, sdp: offer.sdp });
}

async function acceptPeerOffer(peer: Peer, offer: PeerOffer) {
    await peer.peerConnection.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
    const answer = await peer.peerConnection.createAnswer();
    socket.emit('peer-accept', { to: peer.remoteId, from: sessionId, sdp: answer.sdp });
    await peer.peerConnection.setLocalDescription(answer);
}

async function ackOfferAcceptance(peer: Peer, offer: PeerOffer) {
    console.log(`Peer ${peer.remoteId} accepted offer from this peer ${sessionId}`);
    await peer.peerConnection.setRemoteDescription({type: 'answer', sdp: offer.sdp});
}

interface PeerOffer {
    to: string
    from: string
    sdp: string
}

socket.on('peer-offer-direct', async (offer: PeerOffer) => {
    // We have received a request to connect. Find or create the appropriate peer
    if (offer.from in peers) {
        console.log(`Found peer ${peer.remoteId} for offer.`);;
    } else {
        var peer = new Peer(localStream, offer.from);
        peers[offer.from] = peer;
        console.log(`Created peer ${peer.remoteId} for offer.`);
    }

    await acceptPeerOffer(peers[offer.from], offer);

    if (!connectTriggered) {
        // If someone starts the call, automatically join in to ensure proper 3rd-party P2P connections.
        connect();
    }
});

socket.on('peer-accept-direct', async (offer: PeerOffer) => {
    // Finalize acceptance of an offer, ignore unexpected messages
    if (offer.from in peers) {
        await ackOfferAcceptance(peers[offer.from], offer);
    } else {
        console.warn(`Unexpected acceptance from ${offer.from}`);
    }
});

interface PeerIce {
    to: string
    from: string
    candidate: string
    sdpMid: string
    sdpMLineIndex: number
}

socket.on('peer-ice-direct', async (ice: PeerIce) => {
    // Figure out what server this ice candidate is from, then add it
    if (ice.from in peers) {
        var peer = peers[ice.from];
        console.log(`Added ICE candidate from ${peer.remoteId}`);
        await peer.peerConnection.addIceCandidate(
            { candidate: ice.candidate, sdpMid: ice.sdpMid, sdpMLineIndex: ice.sdpMLineIndex });
    } else {
        console.warn(`Unexpected ice candidate from ${ice.from}`);
    }
});

// Get the local video stream up and running.
async function cameraStart() {
    localStream = await playVideoFromCamera();
}

(window as any).cameraStart = cameraStart;
(window as any).connect = connect;