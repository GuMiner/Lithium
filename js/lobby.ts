import { io } from "socket.io-client";

// Connect to the server
const socket = io();
var sessionId = '' + crypto.randomUUID();
socket.on("connect", () => {
    console.log(socket.id);
    sessionId = socket.id;
});

// Update list of any connected clients
setInterval(function() {
    if (socket.connected) {
        const name = (document.getElementById('userName') as HTMLInputElement).value;
        socket.emit('client-update', { id: sessionId, name: name });
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
        clients += `<li>${client.name} <small>(${client.id}) <i>${nameSuffix}</i></small></li>`        
    }
    
    if (clients == '') {
        clients += `<li>No active clients</li>`
    }
    document.getElementById('currentClients').innerHTML = `${prefix}${clients}${suffix}`;
});

// Handle basic ephemeral chatting
document.getElementById('chatForm').onsubmit = e => {
    e.preventDefault();
    const name = (document.getElementById('userName') as HTMLInputElement).value;
    const chatEntry = document.getElementById('chatEntry') as HTMLInputElement;

    socket.emit('chat-client', {name: name, message: chatEntry.value});
    chatEntry.value = '';
}

socket.on('chat-server', (data) => {
    console.log(`Received: {data.data}`);
    document.getElementById('chatResponse').innerHTML += `<br/>${data.data}`
});


// WebRTC testing: https://webrtc.org/getting-started
// Log connected devices
navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        devices.forEach(device =>
            {
                if (device instanceof InputDeviceInfo) {
                    var inputDevice = device as InputDeviceInfo;
                    var capabilities = inputDevice.getCapabilities();
                    console.log(capabilities);
                }

                console.log(device);
            });
    });

async function playVideoFromCamera(): Promise<MediaStream> {
    // This will take a lot of back and forth to get working well, but this does, surprisingly, just work.
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    // For now, stick to something low-res for testing.
    const constraints = {
        'video': {        
            width: { exact: 400 },
            height: { exact: 300 },
        },
        'audio': true};
    const videoElement = document.querySelector('video#localVideo') as HTMLVideoElement;

    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = mediaStream;
    return mediaStream;
}

function iceCallback1Local(event) {
    handleCandidate(event.candidate, pc1Remote, 'pc1: ', 'local');
  }
  
function iceCallback1Remote(event) {
handleCandidate(event.candidate, pc1Local, 'pc1: ', 'remote');
}

function handleCandidate(candidate, dest, prefix, type) {
    dest.addIceCandidate(candidate)
        .then(() => {
            console.log('AddIceCandidate success.');
        }),
        (error) => {
                console.log(`Failed to add ICE candidate: ${error.toString()}`);
        };
    console.log(`${prefix}New ${type} ICE candidate: ${candidate ? candidate.candidate : '(null)'}`);
}

var localStream: MediaStream;

// TODO get the credential from the server upon request.
const server: RTCIceServer = {
};

const servers: RTCConfiguration = {
    iceServers: [
        server   
    ]
};

// Connect to available clients when pressed
document.getElementById('connectForm').onsubmit = e => {
    e.preventDefault();
    connect();
}

class Peer
{
    peerConnection: RTCPeerConnection;
    remoteId: string

    constructor(localStream: MediaStream, clientId: string) {
        this.peerConnection = new RTCPeerConnection(servers);
        this.remoteId = clientId;

        // Ensure that if a remote webcam is received, it is displayed appropriately.
        this.peerConnection.ontrack = (trackEvent) => {
            var videoElement = document.getElementById(`remoteVideo-${clientId}`) as HTMLVideoElement;
            if (videoElement.srcObject !== trackEvent.streams[0]) {
                videoElement.srcObject = trackEvent.streams[0];
                console.log(`Received remote stream from ${clientId}`);
            }
        }

        // TODO ICE negotiation here

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

var peers: Peer[];

function createPeers() {
    // Clear any existing remote videos
    const remoteVideoSection = document.getElementById('remoteVideos');
    remoteVideoSection.innerHTML = ``;
    
    peers = [];
    for (const client of lastKnownClients) {
        if (client.id == sessionId) {
            // No peer for the current user, they have their own video feed already.
            continue;
        }
        // Add a new HTML element for each client
        remoteVideoSection.innerHTML += `<video id="remoteVideo-${client.id}" autoplay playsinline controls="false"></video>`;

        // Create the peer
        var peer = new Peer(localStream, client.id);
        peers.push(peer);
    }
}

async function connect() {
    createPeers();
    
    // Send offers to remote peers
    for (const peer of peers) {
        var offer = await peer.peerConnection.createOffer();
        await peer.peerConnection.setLocalDescription(offer);
        socket.emit('peer-offer', { to: peer.remoteId, from: sessionId, sdp: offer.sdp });
    }
}

interface PeerOffer {
    to: string
    from: string
    sdp: RTCSessionDescriptionInit
}

socket.on('peer-offer-direct', async (offer: PeerOffer) => {
    createPeers();

    // Figure out what server this offer is for, then accept it 
    for (const peer of peers) {
        console.log(peer.remoteId);
        if (peer.remoteId == offer.from) {
            console.log('Found!');

            await peer.peerConnection.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
            const answer = await peer.peerConnection.createAnswer();
            socket.emit('peer-accept', { to: peer.remoteId, from: sessionId, sdp: answer.sdp });
            await peer.peerConnection.setLocalDescription(answer);
        }
    }
});

socket.on('peer-accept-direct', async (offer: PeerOffer) => {
    // Figure out what server this acceptance is from, then finalize it
    for (const peer of peers) {
        console.log(peer.remoteId);
        if (peer.remoteId == offer.from) {
            console.log('Found!');
            await peer.peerConnection.setRemoteDescription({type: 'answer', sdp: offer.sdp});
        }
    }
});

// Get the local video stream up and running.
async function cameraStart() {
    localStream = await playVideoFromCamera();
}

(window as any).cameraStart = cameraStart;