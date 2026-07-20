// =======================
// 2Chat WebRTC Engine
// =======================

let localStream = null;
let remoteStream = null;
let peerConnection = null;

let callSeconds = 0;
let callInterval = null;

const rtcConfig = {

iceServers: [

{
urls: "stun:stun.l.google.com:19302"
}

]

};

async function createPeer(){

peerConnection = new RTCPeerConnection(rtcConfig);

remoteStream = new MediaStream();

document.getElementById("remoteAudio").srcObject =
remoteStream;

// Remote Audio
peerConnection.ontrack = (event)=>{

event.streams[0].getTracks().forEach(track=>{

remoteStream.addTrack(track);

});

};

peerConnection.onicecandidate = (event)=>{

if(event.candidate){

socket.emit("iceCandidate",{

receiver: receiver,

candidate: event.candidate

});

}

};

console.log("✅ PeerConnection Ready");

}

async function startLocalAudio(){

localStream = await navigator.mediaDevices.getUserMedia({

audio:true

});

localStream.getTracks().forEach(track=>{

peerConnection.addTrack(track,localStream);

});

console.log("🎤 Microphone Ready");

}

async function createOffer(receiver){

await createPeer();

await startLocalAudio();

const offer = await peerConnection.createOffer();

await peerConnection.setLocalDescription(offer);

socket.emit("webrtcOffer",{

receiver,

offer

});

console.log("📤 Offer Sent");

}


async function receiveOffer(data){

await createPeer();

await startLocalAudio();

await peerConnection.setRemoteDescription(

new RTCSessionDescription(data.offer)

);

const answer = await peerConnection.createAnswer();

await peerConnection.setLocalDescription(answer);

socket.emit("webrtcAnswer",{

receiver:data.caller,

answer

});

console.log("📤 Answer Sent");

}

socket.on("webrtcOffer", async(data)=>{

await receiveOffer(data);

});


socket.on("webrtcAnswer", async(data)=>{

await peerConnection.setRemoteDescription(

new RTCSessionDescription(data.answer)

);

console.log("✅ Connected");

});

socket.on("iceCandidate", async(data)=>{

if(peerConnection){

await peerConnection.addIceCandidate(

new RTCIceCandidate(data.candidate)

);

}

});

function startCallTimer(){

callSeconds = 0;

clearInterval(callInterval);

callInterval = setInterval(()=>{

callSeconds++;

const min =
String(Math.floor(callSeconds/60)).padStart(2,"0");

const sec =
String(callSeconds%60).padStart(2,"0");

document.getElementById("callTimer").innerText =
`${min}:${sec}`;

},1000);

}

function stopCallTimer(){

clearInterval(callInterval);

callSeconds = 0;

document.getElementById("callTimer").innerText = "00:00";

}


