import { io } from "socket.io-client";

// Add a test websocket
const socket = io();
socket.on("connect", () => {
    console.log(socket.id);
});

// Update list of any connected clients

setInterval(function() {
    if (socket.connected) {
        socket.emit('client-update', "");
    }
}, 3000);

socket.on('current-clients', (data) => {
    var prefix = '<ul>';
    var suffix = '</ul>';
    let clients = '';
    for (const client of data.clients) {
        clients += `<li>${client}</li>`        
    }
    document.getElementById('currentClients').innerHTML = `${prefix}${clients}${suffix}`;
})

document.getElementById('testForm').onsubmit = e => {
    e.preventDefault();
    var input = (document.getElementById('testText') as HTMLInputElement).value;
    console.log(`In ${input}`);
    socket.emit('chat-client', input);
    (document.getElementById('testText') as HTMLInputElement).value = '';
}

socket.on('chat-server', (data) => {
    console.log(`Received: {data.data}`);
    document.getElementById('testLog').innerHTML += `<br/>${data.data}`
});

// WebRTC testing: https://webrtc.org/getting-started
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

function playVideoFromCamera() {
    // This will take a lot of back and forth to get working well, but this does, surprisingly, just work.
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    const constraints = {
        'video': {        
            width: { exact: 400 },
            height: { exact: 300 },
        },
        'audio': true};
    const videoElement = document.querySelector('video#localVideo') as HTMLVideoElement;

    navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => videoElement.srcObject = stream)
        .catch((error) => console.error('Error opening video camera:', error));
}

playVideoFromCamera();