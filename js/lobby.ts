import { io } from "socket.io-client";

// Add a test websocket
const socket = io();
socket.on("connect", () => {
    console.log(socket.id);
});

socket.on('sync-result', (data) => {
    console.log(`Reveived: {data.data}`);
    document.getElementById('testLog').innerHTML += `<br/>${data.data}`
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
    socket.emit('block-sync', input);
    (document.getElementById('testText') as HTMLInputElement).value = '';
}
