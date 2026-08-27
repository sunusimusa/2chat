/* ==========================
   2Chat Messenger
   Part 1
========================== */

const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    location.href = "/login.html";
}

const socket = io();

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

    <span class="voice-time">0:00</span>

    <audio
        class="voice-audio"
        preload="metadata"
        src="${msg.voice}">
    </audio>

</div>
`
:

(msg.text || "")
  

}


${msg.reactions && msg.reactions.length ? `

<div class="message-reactions">

${msg.reactions.map(r=>`

<span class="reaction">${r.emoji}</span>

`).join("")}

</div>

` : ""}

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
   Load Chat User
========================== */

async function loadChatUser() {

    if (!receiver) return;

    try {

        const res = await fetch(`/api/users/profile/${receiver}`);
        const data = await res.json();

        if (!data.success) return;

        const chatUser = data.user;

        document.getElementById("chatName").innerText =
            chatUser.username;

        document.getElementById("chatAvatar").src =
            chatUser.avatar || "/images/default.png";

        const status = document.getElementById("status");

        if (chatUser.online) {

            status.innerHTML =
            '<i class="fa-solid fa-circle online-dot"></i> Online';

        } else {

            status.innerHTML =
            '<i class="fa-regular fa-clock"></i> Offline';

        }

    } catch (err) {

        console.error("Load Chat User Error:", err);

    }

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
   Press Enter
========================== */

messageInput.addEventListener("keydown",function(e){

    if(e.key==="Enter" && !e.shiftKey){

        e.preventDefault();

        safeSend();

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

}

/* ==========================
   VOICE MESSAGE
   WhatsApp-Style
   One Send Button
========================== */

const recordButton = document.getElementById("sendBtn");
const sendIcon = document.getElementById("sendIcon");

const recordingBox =
    document.getElementById("recordingBox");

const recordTime =
    document.getElementById("recordTime");

const recordText =
    document.getElementById("recordText");

const voicePreview =
    document.getElementById("voicePreview");

const cancelVoiceBtn =
    document.getElementById("cancelVoiceBtn");


/* ==========================
   VOICE STATE
========================== */

let recording = false;
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;

let recordTimer = null;
let recordSeconds = 0;


/* ==========================
   UPDATE SEND BUTTON
========================== */

function updateSendButton(){

    if(!recordButton || !sendIcon) return;

    /* Voice ready */
    if(audioBlob && audioBlob.size > 0 && !recording){

        sendIcon.className =
            "fa-solid fa-paper-plane";

        return;
    }

    /* Recording */
    if(recording){

        sendIcon.className =
            "fa-solid fa-stop";

        return;
    }

    /* Text / Image */
    const text =
        messageInput.value.trim();

    const image =
        imageInput.files.length > 0;

    if(text || image){

        sendIcon.className =
            "fa-solid fa-paper-plane";

    }else{

        sendIcon.className =
            "fa-solid fa-microphone";

    }

}


/* ==========================
   START RECORDING
========================== */

async function startRecording(){

    if(recording) return;

    try{

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio:true
            });

        let mimeType = "";

        if(MediaRecorder.isTypeSupported("audio/webm;codecs=opus")){

            mimeType =
                "audio/webm;codecs=opus";

        }else if(MediaRecorder.isTypeSupported("audio/webm")){

            mimeType =
                "audio/webm";

        }

        mediaRecorder =
            mimeType
            ? new MediaRecorder(stream,{mimeType})
            : new MediaRecorder(stream);


        audioChunks = [];
        audioBlob = null;
        recordSeconds = 0;

        recordTime.innerText =
            "00:00";

        recordText.innerText =
            "Recording...";

        recordingBox.style.display =
            "flex";

        voicePreview.style.display =
            "none";

        recording = true;

        updateSendButton();


        /* ======================
           AUDIO DATA
        ====================== */

        mediaRecorder.ondataavailable =
        function(event){

            if(
                event.data &&
                event.data.size > 0
            ){

                audioChunks.push(
                    event.data
                );

            }

        };


        /* ======================
           RECORDING STOP
        ====================== */

        mediaRecorder.onstop =
        function(){

            const type =
                mediaRecorder.mimeType ||
                "audio/webm";

            audioBlob =
                new Blob(
                    audioChunks,
                    {
                        type:type
                    }
                );


            stream
                .getTracks()
                .forEach(track =>
                    track.stop()
                );


            if(!audioBlob.size){

                cancelRecording();

                alert(
                    "Voice recording failed."
                );

                return;

            }


            recording = false;

            clearInterval(recordTimer);


            recordText.innerText =
                "Voice ready";


            /* ======================
               PREVIEW AUDIO
            ====================== */

            const audioURL =
                URL.createObjectURL(
                    audioBlob
                );

            voicePreview.src =
                audioURL;

            voicePreview.controls = true;

            voicePreview.style.display =
                "block";


            /* Send button */
            updateSendButton();

        };


        mediaRecorder.start(250);


        /* ======================
           TIMER
        ====================== */

        recordTimer =
        setInterval(function(){

            recordSeconds++;

            const minutes =
                String(
                    Math.floor(
                        recordSeconds / 60
                    )
                ).padStart(2,"0");

            const seconds =
                String(
                    recordSeconds % 60
                ).padStart(2,"0");

            recordTime.innerText =
                `${minutes}:${seconds}`;

        },1000);


    }catch(error){

        console.error(
            "Microphone Error:",
            error
        );

        alert(
            "Microphone permission denied."
        );

    }

}


/* ==========================
   STOP RECORDING
========================== */

function stopRecording(){

    if(
        !mediaRecorder ||
        mediaRecorder.state === "inactive"
    ){

        return;

    }

    clearInterval(recordTimer);

    mediaRecorder.stop();

}


/* ==========================
   CANCEL VOICE
========================== */

function cancelRecording(){

    clearInterval(recordTimer);


    if(
        mediaRecorder &&
        mediaRecorder.state !== "inactive"
    ){

        mediaRecorder.onstop = null;

        mediaRecorder.stop();

    }


    if(voicePreview){

        voicePreview.pause();

        voicePreview.removeAttribute(
            "src"
        );

        voicePreview.load();

        voicePreview.style.display =
            "none";

    }


    audioChunks = [];

    audioBlob = null;

    recordSeconds = 0;

    recording = false;


    if(recordingBox){

        recordingBox.style.display =
            "none";

    }


    mediaRecorder = null;


    updateSendButton();

}


/* ==========================
   SEND VOICE
========================== */

async function sendVoice(){

    if(
        !audioBlob ||
        !audioBlob.size
    ){

        return;

    }


    const blobToSend =
        audioBlob;

    const duration =
        recordSeconds;


    const formData =
        new FormData();


    formData.append(
        "voice",
        blobToSend,
        "voice.webm"
    );


    formData.append(
        "sender",
        user.username
    );


    formData.append(
        "receiver",
        receiver
    );


    formData.append(
        "duration",
        duration
    );


    /* ======================
       REPLY VOICE
    ====================== */

    if(replyMessage){

        formData.append(
            "replyTo",
            replyMessage._id || ""
        );

        formData.append(
            "replyUser",
            replyMessage.sender || ""
        );

        formData.append(
            "replyText",
            replyMessage.text || ""
        );

        formData.append(
            "replyImage",
            replyMessage.image || ""
        );

        formData.append(
            "replyVoice",
            replyMessage.voice || ""
        );

    }


    try{

        const res =
            await fetch(
                "/api/messages/voice",
                {
                    method:"POST",
                    body:formData
                }
            );


        const data =
            await res.json();


        if(!data.success){

            alert(
                data.message ||
                "Failed to send voice"
            );

            return;

        }


        appendMessage(
            data.message
        );


        socket.emit(
            "newMessage",
            data.message
        );


        /* ======================
           RESET
        ====================== */

        audioChunks = [];

        audioBlob = null;

        recordSeconds = 0;

        clearInterval(recordTimer);


        if(voicePreview){

            voicePreview.pause();

            voicePreview.removeAttribute(
                "src"
            );

            voicePreview.load();

            voicePreview.style.display =
                "none";

        }


        if(recordingBox){

            recordingBox.style.display =
                "none";

        }


        if(replyMessage){

            replyMessage = null;

            const replyPreview =
                document.getElementById(
                    "replyPreview"
                );

            if(replyPreview){

                replyPreview.style.display =
                    "none";

            }

        }


        mediaRecorder = null;

        recording = false;


        updateSendButton();


    }catch(error){

        console.error(
            "Send Voice Error:",
            error
        );

        alert(
            "Network Error"
        );

    }

}


/* ==========================
   ONE SEND BUTTON
========================== */

async function safeSend(){

    if(typeof sending !== "undefined" && sending){

        return;

    }


    /* ======================
       VOICE READY
       SEND
    ====================== */

    if(
        audioBlob &&
        audioBlob.size > 0 &&
        !recording
    ){

        await sendVoice();

        return;

    }


    /* ======================
       RECORDING
       STOP
    ====================== */

    if(recording){

        stopRecording();

        return;

    }


    const text =
        messageInput.value.trim();

    const image =
        imageInput.files[0];


    /* ======================
       TEXT / IMAGE
    ====================== */

    if(text || image){

        if(typeof sending !== "undefined"){

            sending = true;

        }

        try{

            await sendMessage();

        }finally{

            if(typeof sending !== "undefined"){

                sending = false;

            }

            updateSendButton();

        }

        return;

    }


    /* ======================
       EMPTY
       START VOICE
    ====================== */

    await startRecording();

}


/* ==========================
   CANCEL BUTTON
========================== */

if(cancelVoiceBtn){

    cancelVoiceBtn.onclick =
        cancelRecording;

}


/* ==========================
   INPUT EVENTS
========================== */

messageInput.addEventListener(
    "input",
    updateSendButton
);

imageInput.addEventListener(
    "change",
    updateSendButton
);


/* ==========================
   INITIAL
========================== */

updateSendButton();          

/* ==========================
   PART 8
   Menus & Delete
========================== */

function showMessageMenu(e, msg){

    e.preventDefault();

    selectedMsg = msg;

    const menu = document.getElementById("messageMenu");

    if(!menu) return;

    menu.style.display = "block";

    const x = e.pageX || (e.touches ? e.touches[0].pageX : 0);
    const y = e.pageY || (e.touches ? e.touches[0].pageY : 0);

    menu.style.left = x + "px";
    menu.style.top = y + "px";

    const deleteMe = document.getElementById("deleteMeOption");
    const deleteAll = document.getElementById("deleteAllOption");

    if(msg.sender === user.username){

        if(deleteMe) deleteMe.style.display = "flex";
        if(deleteAll) deleteAll.style.display = "flex";

    }else{

        if(deleteMe) deleteMe.style.display = "none";
        if(deleteAll) deleteAll.style.display = "none";

    }

}

function replySelected(){

    if(!selectedMsg) return;

    startReply(selectedMsg);

    document.getElementById("messageMenu").style.display = "none";

}

function reactSelected(){

    if(!selectedMsg) return;

    document.getElementById("messageMenu").style.display = "none";

    selectedMessage = selectedMsg._id;

    const popup = document.getElementById("reactionPopup");

    popup.style.display = "flex";
    popup.style.left = "50%";
    popup.style.top = "50%";
    popup.style.transform = "translate(-50%,-50%)";

}

function deleteSelected(){

    document.getElementById("messageMenu").style.display = "none";

    if(!selectedMsg) return;

    deleteMessage(selectedMsg._id);

}

function deleteEveryoneSelected(){

    document.getElementById("messageMenu").style.display = "none";

    if(!selectedMsg) return;

    deleteForEveryone(selectedMsg._id);

}

function toggleChatMenu(){

    const menu = document.getElementById("chatMenu");

    if(!menu) return;

    menu.style.display =
    menu.style.display === "block"
    ? "none"
    : "block";

}

async function clearChat(){

    if(!confirm("Delete all messages?")) return;

    try{

        const res = await fetch(
            `/api/messages/clear/${user.username}/${receiver}`,
            {
                method:"DELETE"
            }
        );

        const data = await res.json();

        if(data.success){

            document.getElementById("chat").innerHTML = "";

        }else{

            alert(data.message);

        }

    }catch(err){

        console.error(err);

    }

}

document.addEventListener("click",(e)=>{

    const messageMenu =
    document.getElementById("messageMenu");

    if(
        messageMenu &&
        !e.target.closest("#messageMenu")
    ){

        messageMenu.style.display = "none";

    }

    const chatMenu =
    document.getElementById("chatMenu");

    if(
        chatMenu &&
        !e.target.closest("#chatMenu") &&
        !e.target.closest(".header-btn")
    ){

        chatMenu.style.display = "none";

    }

    const popup =
    document.getElementById("reactionPopup");

    if(
        popup &&
        !e.target.closest("#reactionPopup")
    ){

        popup.style.display = "none";
        popup.style.transform = "";

    }

});


/* ==========================
   PART 9
   Socket & Image
========================== */

socket.on("receiveMessage",(msg)=>{

    if (
    (msg.sender === receiver && msg.receiver === user.username) ||
    (msg.sender === user.username && msg.receiver === receiver)
) {
    appendMessage(msg);
}

});

socket.on("messageDelivered",(data)=>{

    loadMessages(false);

});

socket.on("messageSeen",(data)=>{

    loadMessages(false);

});

socket.on("typing",(data)=>{

    if(data.sender!==receiver) return;

    const status=document.getElementById("status");

    if(status){

        status.innerHTML=
        '<i class="fa-solid fa-pen"></i> Typing...';

    }

});

socket.on("stopTyping",()=>{

    const status=document.getElementById("status");

    if(status){

        status.innerHTML=
        '<i class="fa-solid fa-circle online-dot"></i> Online';

    }

});

socket.on("userOnline",(username)=>{

    if(username!==receiver) return;

    const status=document.getElementById("status");

    if(status){

        status.innerHTML=
        '<i class="fa-solid fa-circle online-dot"></i> Online';

    }

});

socket.on("userOffline",(username)=>{

    if(username!==receiver) return;

    const status=document.getElementById("status");

    if(status){

        status.innerHTML=
        '<i class="fa-regular fa-clock"></i> Offline';

    }

});

/* ==========================
   Typing
========================== */

messageInput.addEventListener("input",()=>{

    socket.emit("typing",{

        sender:user.username,

        receiver

    });

    clearTimeout(window.typingTimeout);

    window.typingTimeout=setTimeout(()=>{

        socket.emit("stopTyping",{

            sender:user.username,

            receiver

        });

    },1000);

});

/* ==========================
   Image Preview
========================== */

imageInput.addEventListener("change",()=>{

    const file=imageInput.files[0];

    if(!file) return;

    const reader=new FileReader();

    reader.onload=e=>{

        document.getElementById("previewImage").src=e.target.result;

        document.getElementById("previewBox").style.display="block";

    };

    reader.readAsDataURL(file);

});

function removeImage(){

    imageInput.value="";

    document.getElementById("previewBox").style.display="none";

}

/* ==========================
   Image Viewer
========================== */

function openImage(src){

    const viewer=document.getElementById("imageViewer");

    const img=document.getElementById("fullImage");

    img.src=src;

    viewer.style.display="flex";

}

function closeImage(){

    document.getElementById("imageViewer").style.display="none";

}

/* ==========================
   PART 10
   Final Polish
========================== */

/* ---------- Helpers ---------- */

function scrollToBottom(smooth = true){

    if(!chat) return;

    chat.scrollTo({

        top: chat.scrollHeight,

        behavior: smooth ? "smooth" : "auto"

    });

}

/* ---------- Socket Connect ---------- */

socket.on("connect", () => {
    console.log("Socket Connected");
    socket.emit("join", user.username);
});

socket.on("disconnect",()=>{

    console.log("Socket Disconnected");

});

socket.on("messageDeleted", () => {
    loadMessages(false);
});

/* ---------- Auto Scroll ---------- */

const observer = new MutationObserver(()=>{

    scrollToBottom();

});

if(chat){
    observer.observe(chat,{
        childList:true
    });
}

/* ---------- Focus Input ---------- */

window.addEventListener("load",()=>{

    loadChatUser();

    loadMessages();

    messageInput?.focus();

});

/* ---------- Escape Key ---------- */

document.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        const popup=document.getElementById("reactionPopup");

        const menu=document.getElementById("messageMenu");

        const viewer=document.getElementById("imageViewer");

        if(popup){

            popup.style.display="none";

        }

        if(menu){

            menu.style.display="none";

        }

        if(viewer){

            viewer.style.display="none";

        }

    }

});

/* ---------- Image Viewer ---------- */

document.getElementById("imageViewer")
?.addEventListener("click",(e)=>{

    if(e.target.id==="imageViewer"){

        closeImage();

    }

});

/* ---------- Message Input ---------- */

messageInput.addEventListener("input",()=>{

    sendBtn.style.opacity=
    messageInput.value.trim()!=="" ? "1" : ".8";

});


/* ---------- Prevent Double Send ---------- */
/* ---------- Network ---------- */

window.addEventListener("offline",()=>{

    console.log("Offline");

});

window.addEventListener("online",()=>{

    console.log("Online");

    loadMessages(false);

});


async function deleteMessage(messageId){

    if(!confirm("Delete this message for yourself?")) return;

    try{

        const res = await fetch(`/api/messages/delete/${messageId}`,{
            method:"DELETE",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                username:user.username
            })
        });

        const data = await res.json();

        if(data.success){

            loadMessages(false);

        }else{

            alert(data.message || "Delete failed");

        }

    }catch(err){

        console.error(err);

    }

}

async function deleteForEveryone(messageId){

    if(!confirm("Delete this message for everyone?")) return;

    try{

        const res = await fetch(`/api/messages/delete-everyone/${messageId}`,{
            method:"PUT",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                username:user.username
            })
        });

        const data = await res.json();

        if(data.success){

            loadMessages(false);

            socket.emit("messageDeleted",{
                messageId
            });

        }else{

            alert(data.message || "Delete failed");

        }

    }catch(err){

        console.error("Delete For Everyone Error:",err);

        alert("Network Error");

    }

}


/* ---------- Finished ---------- */

console.log("2Chat Messenger Loaded Successfully");
