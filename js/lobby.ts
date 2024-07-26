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
var connectTriggered: boolean = false;

// Cache the user name to avoid retyping it.
var userName = window.localStorage.getItem("chatUserName");
(document.getElementById('userName') as HTMLInputElement).value = userName;

const InCallState = "In call";
function getState() {
    if (localStream != null) {
        if (connectTriggered) {
            return InCallState;
        }

        return "Ready";
    }

    return "";
}

function isClientInCall(client: Client) {
    return client.state == InCallState;
}

// Update list of any connected clients, also uploading the name and ready state
setInterval(function() {
    if (socket.connected) {
        const name = (document.getElementById('userName') as HTMLInputElement).value;
        if (name != userName) {
            userName = name;
            window.localStorage.setItem("chatUserName", name);
        }
        socket.emit('client-update', { id: sessionId, name: name, state: getState() });
    }
}, 1000);

interface Client {
    id: string,
    name: string,
    state: string
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
        clients += `<li>${client.name} <small>(${client.id}) <i>${nameSuffix}</i></small><b>${client.state}</b></li>`   
        
        if (localStream != null && !connectTriggered && isClientInCall(client))
        {
            // If someone starts the call and our video is on, automatically join in to ensure proper 3rd-party P2P connections.
            connect();
        }
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

    document.getElementById("localVideos").insertAdjacentHTML("beforeend", 
        `<video id="localVideo" class="video-insert" autoplay playsinline></video>`);

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

    makingOffer: boolean;
    queuedIceCandidates: PeerIce[];

    constructor(localStream: MediaStream, clientId: string) {
        this.peerConnection = new RTCPeerConnection(servers);
        this.remoteId = clientId;
        this.queuedIceCandidates = [];
        this.makingOffer = false;

        document.getElementById("remoteVideos").insertAdjacentHTML("beforeend",
            `<video id="remoteVideo-${this.remoteId}" class="video-insert" style="max-height:${window.screen.height/1.5}px" autoplay playsinline></video>`);
        
        // Ensure that if a remote webcam is received, it is displayed appropriately.
        this.peerConnection.ontrack = (trackEvent) => {
            console.log(`Received remote stream from ${this.remoteId}`);
            var videoElement = document.getElementById(`remoteVideo-${this.remoteId}`) as HTMLVideoElement;
            if (videoElement.srcObject !== trackEvent.streams[0]) {
                videoElement.srcObject = trackEvent.streams[0];

                const audioTracksRemote = trackEvent.streams[0].getAudioTracks();
                const videoTracksRemote = trackEvent.streams[0].getVideoTracks();
                if (audioTracksRemote.length > 0) {
                    console.log(`${this.remoteId}: Using remote audio device: ${audioTracksRemote[0].label}`);
                }
                if (videoTracksRemote.length > 0) {
                    console.log(`${this.remoteId}: Using remote video device: ${videoTracksRemote[0].label}`);
                }
            }
        }

        this.peerConnection.onconnectionstatechange = event => {
            console.log(`${this.remoteId}: ${this.peerConnection.connectionState}`);
        }

        // Ensure that all ICE candidates are sent to the remote server
        this.peerConnection.onicecandidate = iceEvent => {
            if (iceEvent.candidate) {
                console.log(`Sending ICE candidate to ${this.remoteId} from ${sessionId}`);
                socket.emit('peer-ice', { to: this.remoteId, from: sessionId, 
                    candidate: iceEvent.candidate.candidate,
                    sdpMid: iceEvent.candidate.sdpMid,
                    sdpMLineIndex: iceEvent.candidate.sdpMLineIndex });
            }
          };

        // Send the local webcam to the remote server
        const audioTracks = localStream.getAudioTracks();
        const videoTracks = localStream.getVideoTracks();
        if (audioTracks.length > 0) {
            console.log(`Using audio device: ${audioTracks[0].label}`);
        }
        if (videoTracks.length > 0) {
            console.log(`Using video device: ${videoTracks[0].label}`);
        }

        localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, localStream));
    }
};

var peers: { [id: string]: Peer; } = {};

async function connectToLesserPeers(client: Client) {
    // Only add peers if they are:
    // - Ready and in the call
    // - Less than the current peer ID
    // - Not already added. 
    if (isClientInCall(client) && client.id < sessionId && !(client.id in peers)) {
        var peer = new Peer(localStream, client.id);
        peers[client.id] = peer;

        await sendPeerOffer(peer);
    }
}

async function connectToReadyPeers() {
    // Add new peers that are missing
    for (const client of lastKnownClients) {
        if (client.id == sessionId) {
            // Skip the current user
            continue;
        }
        
        await connectToLesserPeers(client);
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
    peer.makingOffer = true;
    var offer = await peer.peerConnection.createOffer();
    await peer.peerConnection.setLocalDescription(offer);

    console.log(`Sending peer offer from ${sessionId} to ${peer.remoteId}`);
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

    console.log(`Adding ${peer.queuedIceCandidates.length} queued ICE candidates`)
    for (const ice of peer.queuedIceCandidates) {
        await addIceCandidate(peer, ice);
    }
}

async function addIceCandidate(peer: Peer, ice: PeerIce) {
    await peer.peerConnection.addIceCandidate(
        { candidate: ice.candidate, sdpMid: ice.sdpMid, sdpMLineIndex: ice.sdpMLineIndex });
}

interface PeerOffer {
    to: string
    from: string
    sdp: string
}

socket.on('peer-offer-direct', async (offer: PeerOffer) => {
    // We have received a request to connect. Find or create the appropriate peer
    var peer: Peer;
    if (offer.from in peers) {
        console.log(`Found peer ${offer.from} for offer.`);
        peer = peers[offer.from];
    } else {
        peer = new Peer(localStream, offer.from);
        peers[offer.from] = peer;
        console.log(`Created peer ${peer.remoteId} for offer.`);
    }
    
    if (peer.makingOffer) {
        console.warn(`Received a peer offer from ${peer.remoteId}, which should not be possible as ${sessionId} is already making a connection to this peer.`);
    } else {
        await acceptPeerOffer(peer, offer);
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
        if (peer.peerConnection.remoteDescription) {
            console.log(`Adding ICE candidate from ${ice.from} for this client (${ice.to})`);
            await addIceCandidate(peer, ice);
        } else {
            console.log(`Queuing ICE candidates to add later from ${peer.remoteId} for this client (${ice.to})`);
            peer.queuedIceCandidates.push(ice);
        }

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