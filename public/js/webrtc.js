// =======================
// 2Chat WebRTC Engine
// =======================

let localStream = null;
let remoteStream = null;
let peerConnection = null;

let callSeconds = 0;
let callInterval = null;
let remoteUser = null;
let isMuted = false;
let speakerOn = true;
let callTimeout = null;
let callingAnimation = null;
let inCall = false;

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

    remoteStream = event.streams[0];

    document.getElementById("remoteAudio").srcObject = remoteStream;

    document.getElementById("remoteAudio").play().catch(()=>{});

};

peerConnection.onicecandidate = (event)=>{

if(event.candidate){

socket.emit("iceCandidate",{

receiver: remoteUser,
    
candidate: event.candidate

});

}

};

    peerConnection.oniceconnectionstatechange = ()=>{

    console.log("ICE:", peerConnection.iceConnectionState);

    if(
        peerConnection.iceConnectionState === "connected" ||
        peerConnection.iceConnectionState === "completed"
    ){

        stopCallingAnimation();

        clearTimeout(callTimeout);

        callingTone.pause();
        callingTone.currentTime = 0;

        document.getElementById("callStatus").innerText = "Connected";

        if(!callInterval){
            startCallTimer();
        }

    }
    else if(
        peerConnection.iceConnectionState === "disconnected" ||
        peerConnection.iceConnectionState === "failed" ||
        peerConnection.iceConnectionState === "closed"
    ){

        endCall(false);

    }

};

console.log("✅ PeerConnection Ready");

}

async function startLocalAudio(){

    localStream = await navigator.mediaDevices.getUserMedia({

        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        }

    });

    localStream.getAudioTracks().forEach(track=>{

        peerConnection.addTrack(track, localStream);

    });

    console.log("🎤 Local Audio Ready");

}


async function createOffer(receiver){

    remoteUser = receiver;

    await createPeer();

    await startLocalAudio();

    const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true
    });

    await peerConnection.setLocalDescription(offer);

    socket.emit("webrtcOffer",{
        receiver: remoteUser,
        offer: peerConnection.localDescription
    });

    console.log("📤 Voice Offer Sent");

}

async function receiveOffer(data){

    remoteUser = data.caller;

    await createPeer();

    await startLocalAudio();

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
    );

    const answer = await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer);

    socket.emit("webrtcAnswer",{
        receiver: remoteUser,
        answer: peerConnection.localDescription
    });

    console.log("📤 Voice Answer Sent");

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

    callInterval = setInterval(()=>{

        callSeconds++;

        const min = String(Math.floor(callSeconds / 60)).padStart(2,"0");
        const sec = String(callSeconds % 60).padStart(2,"0");

        document.getElementById("callTimer").innerText =
        `${min}:${sec}`;

    },1000);

}

function stopCallTimer(){

    clearInterval(callInterval);

    callInterval = null;

    callSeconds = 0;

    document.getElementById("callTimer").innerText = "00:00";

}

function endCall(sendSignal = true){

    console.log("END CALL CLICKED");

    stopCallingAnimation();

    clearTimeout(callTimeout);
    callTimeout = null;

    inCall = false;

    stopCallTimer();

    document.getElementById("callScreen").style.display = "none";

    if(localStream){
        localStream.getTracks().forEach(track=>track.stop());
        localStream = null;
    }

    if(remoteStream){
        remoteStream.getTracks().forEach(track=>track.stop());
        remoteStream = null;
    }

    if(peerConnection){
        peerConnection.close();
        peerConnection = null;
    }

    document.getElementById("remoteAudio").srcObject = null;

    ringtone.pause();
    ringtone.currentTime = 0;

    callingTone.pause();
    callingTone.currentTime = 0;

    if(sendSignal && remoteUser){

        socket.emit("endVoiceCall",{
            receiver: remoteUser
        });

    }

    console.log("📴 Call Ended");

}

function toggleMute(){

    if(!localStream) return;

    isMuted = !isMuted;

    localStream.getAudioTracks().forEach(track=>{

        track.enabled = !isMuted;

    });

    const icon =
    document.querySelector("#muteBtn i");

    if(isMuted){

        icon.className =
        "fa-solid fa-microphone-slash";

    }else{

        icon.className =
        "fa-solid fa-microphone";

    }

}

function toggleSpeaker(){

    const audio = document.getElementById("remoteAudio");

    speakerOn = !speakerOn;

    const icon = document.querySelector("#speakerBtn i");

    if(speakerOn){

        audio.volume = 1;

        icon.className = "fa-solid fa-volume-high";

    }else{

        audio.volume = 0.3;

        icon.className = "fa-solid fa-volume-low";

    }

}

function startCallingAnimation(){

    const status =
    document.getElementById("callStatus");

    let dots = 0;

    clearInterval(callingAnimation);

    callingAnimation = setInterval(()=>{

        dots++;

        if(dots > 3){
            dots = 1;
        }

        status.innerText =
        "Calling" + ".".repeat(dots);

    },500);

}

