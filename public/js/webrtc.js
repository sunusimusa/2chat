// =======================
// 2Chat WebRTC Engine
// =======================

let localStream = null;
let remoteStream = null;
let peerConnection = null;

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


