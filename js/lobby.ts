import { io } from "socket.io-client";

// Connect to the server
const socket = io();
const sessionId = crypto.randomUUID();
socket.on("connect", () => {
    console.log(socket.id);
});

// Update list of any connected clients
setInterval(function() {
    if (socket.connected) {
        const name = (document.getElementById('userName') as HTMLInputElement).value;
        socket.emit('client-update', { id: sessionId, name: name });
    }
}, 2000);

// TODO I probably need the sessionIDs of the clients too.
var lastKnownClients = null;
socket.on('current-clients', (data) => {
    var prefix = '<ul>';
    var suffix = '</ul>';
    let clients = '';

    lastKnownClients = data.clients;
    for (const client of data.clients) {
        clients += `<li>${client}</li>`        
    }
    
    if (clients == '') {
        clients += `<li>No active clients</li>`
    }
    document.getElementById('currentClients').innerHTML = `${prefix}${clients}${suffix}`;
})

// Connect to available clients if connect pressed
document.getElementById('connectForm').onsubmit = e => {
    e.preventDefault();
    connect();
}

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

// TODO figure out how to pass credentials in.
const configuration = {'iceServers': [{'urls': 'turn:helium24.net:3478'}]}

let pc1Local: RTCPeerConnection;
let pc1Remote: RTCPeerConnection;

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

function gotRemoteStream1(e) {
    const videoElement = document.querySelector('video#remoteVideo') as HTMLVideoElement;
    maybeSetCodecPreferences(e);
    if (videoElement.srcObject !== e.streams[0]) {
      videoElement.srcObject = e.streams[0];
      console.log('pc1: received remote stream');
    }
  }

  // Necessary? Should at least log the codec types
  const supportsSetCodecPreferences = window.RTCRtpTransceiver &&
  'setCodecPreferences' in window.RTCRtpTransceiver.prototype;
function maybeSetCodecPreferences(trackEvent) {
  if (!supportsSetCodecPreferences) return;
  if (trackEvent.track.kind === 'video') {
    const {codecs} = RTCRtpReceiver.getCapabilities('video');
    for (const codec of codecs) {
        console.log(codec.clockRate)
        console.log(codec.mimeType);
    }
    const selectedCodecIndex = codecs.findIndex(c => c.mimeType === 'video/VP8');
    const selectedCodec = codecs[selectedCodecIndex];
    codecs.splice(selectedCodecIndex, 1);
    codecs.unshift(selectedCodec);
    trackEvent.transceiver.setCodecPreferences(codecs);
  }
}

// TODO get the credential from the server upon request.
const server: RTCIceServer = {
    // See secure.conf
};

const servers: RTCConfiguration = {
    iceServers: [
        server   
    ]
};

var localStream: MediaStream;

async function connect() {
    const audioTracks = localStream.getAudioTracks();
    const videoTracks = localStream.getVideoTracks();
    if (audioTracks.length > 0) {
      console.log(`Using audio device: ${audioTracks[0].label}`);
    }
    if (videoTracks.length > 0) {
      console.log(`Using video device: ${videoTracks[0].label}`);
    }

    pc1Local = new RTCPeerConnection(servers);
    pc1Local.onicecandidate = iceCallback1Local;
    localStream.getTracks().forEach(track => pc1Local.addTrack(track, localStream));
    console.log('Adding local stream to pc1Local');
    
    const offerOptions: RTCOfferOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    };
    
    var offer = await pc1Local.createOffer(offerOptions)
    pc1Local.setLocalDescription(offer);
    socket.emit('rtc-request', offer)
}

socket.on('rtc-request-broadcast', (offer) => {
    pc1Remote = new RTCPeerConnection(servers);
    pc1Remote.ontrack = gotRemoteStream1;
    pc1Remote.onicecandidate = iceCallback1Remote;
    gotDescription1Local(offer);

});

async function gotDescription1Local(desc) {
  console.log(`Offer from pc1Local\n${desc.sdp}`);
  await pc1Remote.setRemoteDescription(desc);

  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  // AKA, simulate the existing 'local' video
  await pc1Remote.setLocalDescription(desc);
  var answer = await pc1Remote.createAnswer();

  // Signal that the local (caller) should now pickup
  socket.emit('rtc-response', answer);
}

socket.on('rtc-response-broadcast', (offerResponse) => 
{
    console.log(`Answer from pc1Remote\n${offerResponse.sdp}`);
    pc1Local.setRemoteDescription(offerResponse);
});

// Get the local video stream up and running.
async function cameraStart() {
    localStream = await playVideoFromCamera();
}

(window as any).cameraStart = cameraStart;