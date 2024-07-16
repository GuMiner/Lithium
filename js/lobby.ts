import { Socket, io } from "socket.io-client";
import { JSFrame } from 'jsframe.js';

// Connect to the server, setting the session ID and getting the TURN server details.
const socket: Socket = io();
const jsFrame: JSFrame = new JSFrame();

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
}, 2000);

interface Client {
    id: string,
    name: string
}

var lastKnownClients: Client[] = null;
socket.on('current-clients', (data) => {
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

function createFloatingVideoFrame(title: string, videoElementId: string, stream: MediaStream) {
    const frame = jsFrame.create({
        title: title,
        left: 20 + Math.random() * 400, top: 20, width: 400, height: 300,
        movable: true, //Enable to be moved by mouse
        resizable: true, //Enable to be resized by mouse
        html: `<video id="${videoElementId}" class="video-insert" autoplay playsinline></video>`
    });
    frame.show();

    // Ensure that the inline frame resizes to match the video resolution
    var localVideo = (document.getElementById(videoElementId) as HTMLVideoElement);
    localVideo.srcObject = stream;
    localVideo.onresize = function() {
        console.log(`${title}: ${localVideo.videoWidth}x${localVideo.videoHeight}`);
        frame.setSize(localVideo.videoWidth, localVideo.videoHeight + 20);
    };

    // Ensure that frame resizes can affect the local video too
    frame.on('frame', 'resize', (data) => {
        localVideo.width = data.size.width;
        localVideo.height = data.size.height - 20;
     });
 
    return frame;
}

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

    createFloatingVideoFrame(`${userName}'s video`, "localVideo", videoOnlyStream);

    // Unhide the rest of the UI
    document.getElementById('waitForCamera').removeAttribute('style');
    return mediaStream;
}

class Peer
{
    peerConnection: RTCPeerConnection;
    remoteName: string;
    remoteId: string;
    remoteVideoFrame: any;

    constructor(localStream: MediaStream, clientName: string, clientId: string) {
        this.peerConnection = new RTCPeerConnection(servers);
        this.remoteName = clientName;
        this.remoteId = clientId;
        this.remoteVideoFrame = null;

        // Ensure that if a remote webcam is received, it is displayed appropriately.
        this.peerConnection.ontrack = (trackEvent) => {
            if (this.remoteVideoFrame == null) {
                console.log(`Received remote stream from ${clientId}`);
                this.remoteVideoFrame = createFloatingVideoFrame(`${this.remoteName}'s video`, `remoteVideo-${this.remoteId}`, trackEvent.streams[0]);
            } else {
                var videoElement = document.getElementById(`remoteVideo-${this.remoteId}`) as HTMLVideoElement;
                if (videoElement.srcObject !== trackEvent.streams[0]) {
                    videoElement.srcObject = trackEvent.streams[0];
                }
            }
        }

        // Ensure that all ICE candidates are sent to the remote server
        this.peerConnection.onicecandidate = iceEvent => {
            if (iceEvent.candidate) {
                console.log(iceEvent.candidate);
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

// TODO could rearchitect this into a mapping of peers based off of their IDs, however that's not necessary for this example app.
var peers: Peer[] = [];

function createPeers() {
    for (const peer of peers) {
        if (peer.remoteVideoFrame != null) {
            peer.remoteVideoFrame.hide();
        }
    }
    
    peers = [];
    for (const client of lastKnownClients) {
        if (client.id == sessionId) {
            // No peer for the current user, they have their own video feed already.
            continue;
        }

        // Create the peer
        var peer = new Peer(localStream, client.name, client.id);
        peers.push(peer);
    }
}

async function connect() {
    // Start connection by initializing the list of peers
    createPeers();
    
    // Send offers to remote peers
    for (const peer of peers) {
        await sendPeerOffer(peer);
    }
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

interface PeerOffer {
    to: string
    from: string
    sdp: string
}

socket.on('peer-offer-direct', async (offer: PeerOffer) => {
    // We have received a request to connect, ensure there exist peers to connect to/from.
    if (peers.length == 0) {
        createPeers();
    }

    // Figure out what server this offer is for, then accept it 
    for (const peer of peers) {
        console.log(peer.remoteId);
        if (peer.remoteId == offer.from) {
            console.log(`Found peer ${peer.remoteId} for offer.`);
            await acceptPeerOffer(peer, offer);
        } else if (peer.remoteId == sessionId) {
            // Do nothing for ourselves
            continue;
        } else if (peer.remoteId > sessionId) {
            // If a peer is lower for other peers, trigger the offer/acceptance process for them.
            // This ensures that a true P2P connection is established between all participants.
            await sendPeerOffer(peer);
        }
    }
});

socket.on('peer-accept-direct', async (offer: PeerOffer) => {
    // Figure out what server this acceptance is from, then finalize it
    for (const peer of peers) {
        console.log(peer.remoteId);
        if (peer.remoteId == offer.from) {
            console.log(`Peer ${peer.remoteId} accepted offer from this peer ${sessionId}`);
            await peer.peerConnection.setRemoteDescription({type: 'answer', sdp: offer.sdp});
        }
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
        for (const peer of peers) {
            console.log(peer.remoteId);
            if (peer.remoteId == ice.from) {
                console.log(`Added ICE candidate from ${peer.remoteId}`);
                await peer.peerConnection.addIceCandidate(
                    { candidate: ice.candidate, sdpMid: ice.sdpMid, sdpMLineIndex: ice.sdpMLineIndex });
            }
        }
});

// Get the local video stream up and running.
async function cameraStart() {
    localStream = await playVideoFromCamera();
}

(window as any).cameraStart = cameraStart;
(window as any).connect = connect;