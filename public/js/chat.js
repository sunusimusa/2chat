/* ==========================
   2Chat Messenger
   Part 1
========================== */

const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    location.href = "/login.html";
}

const socket = io();

socket.emit("join", user.username);

const params = new URLSearchParams(location.search);

const receiver = params.get("user");

/* ==========================
   Global Variables
========================== */

let selectedMessage = null;
let selectedMsg = null;
let replyMessage = null;

let currentBubble = null;
let swipeMessage = null;
let startX = 0;

let recording = false;
let paused = false;

let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;

let recordTimer = null;
let recordSeconds = 0;

/* ==========================
   DOM
========================== */

const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const imageInput = document.getElementById("image");
const sendBtn = document.getElementById("sendBtn");

function renderMessage(msg){

const mine = msg.sender === user.username;

return `

<div class="${mine ? "me" : "other"}">

<div
class="${mine ? "bubble-me" : "bubble-other"}"
data-id="${msg._id}"

oncontextmenu="showMessageMenu(event,${JSON.stringify(msg).replace(/"/g,"&quot;")})"

ontouchstart="touchStart(event,${JSON.stringify(msg).replace(/"/g,"&quot;")})"

ontouchmove="touchMove(event)"

ontouchend="touchEnd(event)"
>

${msg.image ? `
<div class="message-image">
<img src="${msg.image}" onclick="openImage('${msg.image}')">
</div>
` : ""}

${msg.replyTo ? `
<div class="reply-bubble">

<div class="reply-user">
↩ ${msg.replyUser}
</div>

<div class="reply-message">
${msg.replyText || "Message"}
</div>

</div>
` : ""}

${msg.deletedForEveryone ?

`<div class="deleted-message">

<i class="fa-solid fa-ban"></i>

This message was deleted

</div>`

:


msg.voice ?

`
<div class="voice-player">

<button class="voice-play">

<i class="fa-solid fa-play"></i>

</button>

<div class="voice-wave">

<div class="voice-progress"></div>

</div>

<span class="voice-time">
0:00
</span>

<audio class="voice-audio">

<source src="${msg.voice}" type="audio/webm">

</audio>

</div>
`

:

(msg.text || "")
  

}

<div class="message-time">

${msg.createdAt ?

new Date(msg.createdAt).toLocaleTimeString([],{

hour:"2-digit",

minute:"2-digit"

})

:

""}

</div>

${mine ?

`<small class="message-status">

${

msg.seen ?

'<i class="fa-solid fa-check-double" style="color:#00b7ff"></i>'

:

msg.delivered ?

'<i class="fa-solid fa-check-double"></i>'

:

'<i class="fa-solid fa-check"></i>'

}

</small>`

:

""}

</div>

</div>

`;

}

/* ==========================
   Load Messages
========================== */

async function loadMessages(autoScroll = true){

    if(!receiver) return;

    try{

        const res = await fetch(
            `/api/messages/chat?sender=${user.username}&receiver=${receiver}`
        );

        const data = await res.json();

        if(!data.success){

            chat.innerHTML = "";

            return;

        }

        const messages = data.messages || [];

        chat.innerHTML = "";

        messages.forEach(msg=>{

            chat.insertAdjacentHTML(
                "beforeend",
                renderMessage(msg)
            );

            if(
                msg.receiver === user.username &&
                !msg.seen
            ){

                socket.emit("messageSeen",{

                    sender:msg.sender,

                    messageId:msg._id

                });

            }

        });

        if(autoScroll){

            requestAnimationFrame(()=>{

                chat.scrollTop = chat.scrollHeight;

            });

        }

        loadVoicePlayers();

    }catch(err){

        console.error("Load Messages Error:",err);

    }

}

/* ==========================
   Append One Message
========================== */

function appendMessage(msg){

    if(!msg) return;

    chat.insertAdjacentHTML(
        "beforeend",
        renderMessage(msg)
    );

    requestAnimationFrame(()=>{

        chat.scrollTop = chat.scrollHeight;

    });

    loadVoicePlayers();

}

/* ==========================
   Send Message
========================== */

async function sendMessage(){

    const text = messageInput.value.trim();
    const image = imageInput.files[0];

    if(text === "" && !image && !replyMessage){
        return;
    }

    const formData = new FormData();

    formData.append("sender", user.username);
    formData.append("receiver", receiver);
    formData.append("text", text);

    if(image){
        formData.append("file", image);
    }

    if(replyMessage){

        formData.append("replyTo", replyMessage._id || "");

        formData.append("replyUser", replyMessage.sender || "");

        formData.append("replyText", replyMessage.text || "");

        formData.append("replyImage", replyMessage.image || "");

        formData.append("replyVoice", replyMessage.voice || "");

    }

    try{

        const res = await fetch("/api/messages/send",{

            method:"POST",

            body:formData

        });

        const data = await res.json();

        if(!data.success){

            alert(data.message || "Failed to send message");

            return;

        }

        appendMessage(data.message);

        socket.emit("newMessage", data.message);

        messageInput.value = "";

        imageInput.value = "";

        replyMessage = null;

        const preview = document.getElementById("replyPreview");

        if(preview){
            preview.style.display = "none";
        }

        const previewBox = document.getElementById("previewBox");

        if(previewBox){
            previewBox.style.display = "none";
        }

        chat.scrollTop = chat.scrollHeight;

    }catch(err){

        console.error(err);

        alert("Network Error");

    }

}

/* ==========================
   Send Button
========================== */

sendBtn.addEventListener("click", sendMessage);

/* ==========================
   Press Enter
========================== */

messageInput.addEventListener("keydown",function(e){

    if(e.key==="Enter" && !e.shiftKey){

        e.preventDefault();

        sendMessage();

    }

});

/* ==========================
   Reply System
========================== */

function startReply(msg){

    if(!msg) return;

    replyMessage = msg;

    const preview = document.getElementById("replyPreview");
    const replyText = document.getElementById("replyText");

    if(!preview || !replyText) return;

    let text = "Message";

    if(msg.text){

        text = msg.text;

    }else if(msg.image){

        text = "📷 Photo";

    }else if(msg.voice){

        text = "🎤 Voice message";

    }

    replyText.innerText = text;

    preview.style.display = "flex";

}

function cancelReply(){

    replyMessage = null;

    const preview = document.getElementById("replyPreview");

    if(preview){

        preview.style.display = "none";

    }

}

/* ==========================
   Swipe Reply
========================== */

function touchStart(e,msg){

    startX = e.touches[0].clientX;

    currentBubble =
    e.target.closest(".bubble-me,.bubble-other");

    swipeMessage = msg;

    if(currentBubble){

        currentBubble.style.transition = "";

    }

}

function touchMove(e){

    if(!currentBubble) return;

    const moveX = e.touches[0].clientX;

    let diff = moveX - startX;

    diff = Math.max(0,Math.min(diff,60));

    currentBubble.style.transform =
    `translateX(${diff}px)`;

}

function touchEnd(){

    if(!currentBubble) return;

    const style =
    currentBubble.style.transform;

    let moved = 0;

    const match =
    style.match(/translateX\(([\d.]+)px\)/);

    if(match){

        moved = parseFloat(match[1]);

    }

    currentBubble.style.transition = ".2s";

    currentBubble.style.transform =
    "translateX(0px)";

    if(moved >= 35){

        navigator.vibrate?.(30);

        startReply(swipeMessage);

    }

    setTimeout(()=>{

        if(currentBubble){

            currentBubble.style.transition = "";

        }

    },200);

    currentBubble = null;

    swipeMessage = null;

}

/* ==========================
   Voice Recording
========================== */

async function startRecording(){

    if(recording) return;

    try{

        const stream = await navigator.mediaDevices.getUserMedia({
            audio:true
        });

        mediaRecorder = new MediaRecorder(stream);

        audioChunks = [];

        mediaRecorder.ondataavailable = e=>{

            if(e.data.size>0){

                audioChunks.push(e.data);

            }

        };

        mediaRecorder.onstop=()=>{

            audioBlob=new Blob(audioChunks,{
                type:"audio/webm"
            });

            stream.getTracks().forEach(track=>track.stop());

        };

        mediaRecorder.start();

        recording=true;

        paused=false;

        recordSeconds=0;

        document.getElementById("recordingBox").style.display="flex";

        document.getElementById("stopRecordBtn").style.display="flex";

        document.getElementById("recordBtn").innerHTML=
        '<i class="fa-solid fa-pause"></i>';

        recordTimer=setInterval(()=>{

            recordSeconds++;

            const m=String(Math.floor(recordSeconds/60)).padStart(2,"0");

            const s=String(recordSeconds%60).padStart(2,"0");

            document.getElementById("recordTime").innerText=
            `${m}:${s}`;

        },1000);

    }catch(err){

        console.error(err);

        alert("Microphone permission denied.");

    }

}

/* ==========================
   Pause
========================== */

function pauseRecording(){

    if(!mediaRecorder) return;

    mediaRecorder.pause();

    paused=true;

    clearInterval(recordTimer);

    document.getElementById("recordBtn").innerHTML=
    '<i class="fa-solid fa-play"></i>';

}

/* ==========================
   Resume
========================== */

function resumeRecording(){

    if(!mediaRecorder) return;

    mediaRecorder.resume();

    paused=false;

    document.getElementById("recordBtn").innerHTML=
    '<i class="fa-solid fa-pause"></i>';

    recordTimer=setInterval(()=>{

        recordSeconds++;

        const m=String(Math.floor(recordSeconds/60)).padStart(2,"0");

        const s=String(recordSeconds%60).padStart(2,"0");

        document.getElementById("recordTime").innerText=
        `${m}:${s}`;

    },1000);

}

/* ==========================
   Toggle
========================== */

function toggleRecording(){

    if(!recording){

        startRecording();

        return;

    }

    if(paused){

        resumeRecording();

    }else{

        pauseRecording();

    }

}

/* ==========================
   Stop Recording
========================== */

function stopRecording(){

    if(!recording) return;

    recording=false;

    clearInterval(recordTimer);

    document.getElementById("recordingBox").style.display="none";

    document.getElementById("stopRecordBtn").style.display="none";

    document.getElementById("recordBtn").innerHTML=
    '<i class="fa-solid fa-microphone"></i>';

    if(mediaRecorder &&
       mediaRecorder.state!=="inactive"){

        mediaRecorder.stop();

    }

}

/* ==========================
   Send Voice
========================== */

async function sendVoice(){

    if(!audioBlob) return;

    const formData=new FormData();

    formData.append("voice",audioBlob,"voice.webm");

    formData.append("sender",user.username);

    formData.append("receiver",receiver);

    formData.append("duration",recordSeconds);

    const res=await fetch("/api/messages/voice",{

        method:"POST",

        body:formData

    });

    const data=await res.json();

    if(data.success){

        appendMessage(data.message);

        socket.emit("newMessage",data.message);

        audioBlob=null;

        recordSeconds=0;

    }else{

        alert(data.message);

    }

}

/* ==========================
   Voice Player
========================== */

function loadVoicePlayers(){

    document.querySelectorAll(".voice-player").forEach(player=>{

        const playBtn = player.querySelector(".voice-play");
        const audio = player.querySelector(".voice-audio");
        const progress = player.querySelector(".voice-progress");
        const time = player.querySelector(".voice-time");

        if(!playBtn || !audio) return;

        playBtn.onclick = ()=>{

            // Dakatar da sauran audio
            document.querySelectorAll(".voice-audio").forEach(a=>{

                if(a!==audio){

                    a.pause();

                    a.currentTime=0;

                    const p=a.closest(".voice-player");

                    if(p){

                        p.querySelector(".voice-play").innerHTML=
                        '<i class="fa-solid fa-play"></i>';

                        p.querySelector(".voice-progress").style.width="0%";

                    }

                }

            });

            if(audio.paused){

                audio.play();

                playBtn.innerHTML=
                '<i class="fa-solid fa-pause"></i>';

            }else{

                audio.pause();

                playBtn.innerHTML=
                '<i class="fa-solid fa-play"></i>';

            }

        };

        audio.onloadedmetadata=()=>{

            const total=Math.floor(audio.duration||0);

            const m=Math.floor(total/60);

            const s=String(total%60).padStart(2,"0");

            time.innerText=`${m}:${s}`;

        };

        audio.ontimeupdate=()=>{

            const percent=
            (audio.currentTime/audio.duration)*100;

            progress.style.width=percent+"%";

            const current=Math.floor(audio.currentTime);

            const m=Math.floor(current/60);

            const s=String(current%60).padStart(2,"0");

            time.innerText=`${m}:${s}`;

        };

        audio.onended=()=>{

            playBtn.innerHTML=
            '<i class="fa-solid fa-play"></i>';

            progress.style.width="0%";

            const total=Math.floor(audio.duration||0);

            const m=Math.floor(total/60);

            const s=String(total%60).padStart(2,"0");

            time.innerText=`${m}:${s}`;

        };

    });

}


