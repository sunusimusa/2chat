const user = JSON.parse(localStorage.getItem("user"));

window.onerror = function(message, source, line, col, error){
    alert(
        "JS ERROR:\n" +
        message +
        "\nLine: " + line
    );
};

let selectedMessage = null;
let replyMessage = null;
let startX = 0;
let currentBubble = null;
let swipeMessage = null;

let recording = false;
let recordSeconds = 0;
let recordTimer = null;

let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let paused = false;
let selectedMsg = null;



if (!user) {
    location.href = "/login.html";
}

const socket = io();

socket.emit("join", user.username);

const params = new URLSearchParams(window.location.search);

const receiver = params.get("user");

loadChatUser();

async function loadChatUser(){

    console.log("Receiver:", receiver);

    if(!receiver){
        console.log("Receiver is empty");
        return;
    }

    try{

        const res = await fetch(`/api/users/profile/${receiver}`);

        console.log("Status:", res.status);

        const data = await res.json();

        console.log("Response:", data);

        if(data.success){

            document.getElementById("chatUser").innerText =
            data.user.username;

            document.getElementById("chatAvatar").src =
            data.user.avatar || "/images/default.png";

        }

    }catch(err){

        console.error("Fetch Error:", err);

    }

}

const messageBox =
document.getElementById("message");

let typingTimeout;

if(messageBox){

messageBox.addEventListener("input",()=>{

socket.emit("typing",{
sender:user.username,
receiver
});

clearTimeout(typingTimeout);

typingTimeout = setTimeout(()=>{

socket.emit("stopTyping",{
sender:user.username,
receiver
});

},1000);

});

}

document.getElementById("chatUser").innerText =
receiver;

socket.on("userOnline",(username)=>{

if(username===receiver){

document.getElementById("status").innerHTML =
'<i class="fa-solid fa-circle" style="color:#00ff66;font-size:10px"></i> Online';

}

});

socket.on("userOffline",(username)=>{

if(username===receiver){

document.getElementById("status").innerHTML =
'<i class="fa-regular fa-clock"></i> Last seen recently';
    
}

});

function appendMessage(msg){

    if(!msg) return;

    const chat = document.getElementById("chat");
    if(!chat) return;

    const mine = msg.sender === user.username;

    const div = document.createElement("div");
    div.className = mine ? "me" : "other";

    const safeMsg = JSON.stringify(msg).replace(/"/g,"&quot;");

    div.innerHTML = `

<div
class="${mine ? "bubble-me" : "bubble-other"}"
oncontextmenu="showMessageMenu(event,${safeMsg})"
ontouchstart="touchStart(event,${safeMsg})"
ontouchmove="touchMove(event)"
ontouchend="touchEnd(event)"
>

<span class="reply-icon-inside">
<i class="fa-solid fa-reply"></i>
</span>

${msg.image ? `
<img
src="${msg.image}"
onclick="openImage('${msg.image}')"
style="
width:100%;
max-width:220px;
border-radius:12px;
display:block;
margin-bottom:8px;
cursor:pointer;
">
` : ""}

${msg.replyTo ? `

<div class="reply-bubble">

<div class="reply-user">
↩ ${msg.replyUser || ""}
</div>

<div class="reply-message">

${
msg.replyImage ?

`<img src="${msg.replyImage}" class="reply-thumb">`

:

msg.replyVoice ?

`<div class="reply-voice">🎤 Voice message</div>`

:

(msg.replyText || "Message")

}

</div>

</div>

` : ""}

${
msg.deletedForEveryone ?

`
<div class="deleted-message">
<i class="fa-solid fa-ban"></i>
This message was deleted
</div>
`

:

msg.voice ?

`
<div class="voice-player">

<button class="voice-play">
<i class="fa-solid fa-play"></i>
</button>

<div class="voice-wave">

<div class="voice-bars">
${"<span></span>".repeat(15)}
</div>

<div class="voice-progress"></div>

</div>

<span class="voice-time">
${Math.floor((msg.voiceDuration || 0)/60)}:${String((msg.voiceDuration || 0)%60).padStart(2,"0")}
</span>

<audio class="voice-audio">
<source src="${msg.voice}" type="audio/webm">
</audio>

</div>
`

:

(msg.text || "")

}

${Array.isArray(msg.reactions) && msg.reactions.length ? `

<div class="message-reactions">

${msg.reactions.map(r=>`
<span>${r.emoji}</span>
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

${mine ? `

<small class="message-status">

${

msg.seen ?

'<i class="fa-solid fa-check-double" style="color:#00b7ff"></i> Seen'

:

msg.delivered ?

'<i class="fa-solid fa-check-double"></i> Delivered'

:

'<i class="fa-solid fa-check"></i> Sent'

}

</small>

` : ""}

</div>
`;

    chat.appendChild(div);

    requestAnimationFrame(()=>{
        chat.scrollTop = chat.scrollHeight;
    });

    if(typeof loadVoiceDurations === "function"){
        loadVoiceDurations();
    }

}

async function loadMessages(autoScroll = true){

    if(!receiver) return;

    try{

        const res = await fetch(
            `/api/messages/chat?sender=${user.username}&receiver=${receiver}`
        );

        const data = await res.json();

        // Kariya idan API ta dawo da error
        if(!data.success){
            document.getElementById("chat").innerHTML = "";
            return;
        }

        // Kariya idan messages babu
        const messages = data.messages || [];

        messages.forEach(msg=>{

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

        let html = "";

        messages.forEach(msg=>{

            const mine = msg.sender === user.username;

            html += `

<div class="${mine ? "me" : "other"}">

<div
class="${mine ? "bubble-me" : "bubble-other"}"

oncontextmenu="showMessageMenu(event,${JSON.stringify(msg).replace(/"/g,"&quot;")})"

ontouchstart="touchStart(event, ${JSON.stringify(msg).replace(/"/g,"&quot;")})"

ontouchmove="touchMove(event)"

ontouchend="touchEnd(event)"

>

<span class="reply-icon-inside">

<i class="fa-solid fa-reply"></i>

</span>

${
msg.image
?
`<img
src="${msg.image}"
onclick="openImage('${msg.image}')"
style="
width:100%;
max-width:220px;
border-radius:12px;
display:block;
margin-bottom:8px;
cursor:pointer;
">`
:
""
}

${

msg.replyTo
?

`

<div class="reply-bubble">

<div class="reply-user">

↩ ${msg.replyUser}

</div>

<div class="reply-message">

${
msg.replyImage
?

`
<img
src="${msg.replyImage}"
class="reply-thumb">
`

:

msg.replyVoice
?

`
<div class="reply-voice">

🎤 Voice message

</div>
`

:

msg.replyText || "Message"

}

</div>

</div>

`

:

""

}

${msg.deletedForEveryone ? `
<div class="deleted-message">
    <i class="fa-solid fa-ban"></i>
    This message was deleted
</div>
` :
msg.voice ? `

<div class="voice-player">

    <button class="voice-play">
        <i class="fa-solid fa-play"></i>
    </button>

    <div class="voice-wave">

        <div class="voice-bars">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
        </div>

        <div class="voice-progress"></div>

    </div>

    <span class="voice-time">
        ${Math.floor((msg.voiceDuration || 0)/60)}:${String((msg.voiceDuration || 0)%60).padStart(2,"0")}
    </span>

    <audio class="voice-audio">
        <source src="${msg.voice}" type="audio/webm">
    </audio>

</div>

` : (msg.text || "")}

${Array.isArray(msg.reactions) && msg.reactions.length ? `
<div class="message-reactions">
    ${msg.reactions.map(r=>`
        <span>${r?.emoji || ""}</span>
    `).join("")}
</div>
` : ""}

<div class="message-time">

${msg.createdAt
? new Date(msg.createdAt).toLocaleTimeString([],{
hour:"2-digit",
minute:"2-digit"
})
: ""}

</div>

${
mine
?
`
<small class="message-status">

${
msg.seen
?
'<i class="fa-solid fa-check-double" style="color:#00b7ff"></i> Seen'
:
msg.delivered
?
'<i class="fa-solid fa-check-double"></i> Delivered'
:
'<i class="fa-solid fa-check"></i> Sent'
}

</small>
`
:
""
}

</div>

`;

}
                         
const chat = document.getElementById("chat");

// Idan chat element bai samu ba
if(!chat) return;

// Saka messages
chat.innerHTML = html;

// Load voice durations idan akwai
if(typeof loadVoiceDurations === "function"){
    loadVoiceDurations();
}

// Auto scroll
if(autoScroll){

    requestAnimationFrame(()=>{

        // Idan akwai message
        if(chat.children.length > 0){

            chat.scrollTop = chat.scrollHeight;

        }else{

            chat.scrollTop = 0;

        }

    });

}

}catch(err){

    console.error("loadMessages Error:", err);

    const chat = document.getElementById("chat");

    if(chat){

        chat.innerHTML = "";

    }

}
    
}

async function sendMessage(){

const text =
document.getElementById("message").value.trim();

const image =
document.getElementById("image").files[0];
    
if(text === "" && !image){
    return;
}

const formData = new FormData();

formData.append("sender",user.username);
formData.append("receiver",receiver);
formData.append("text",text);

if(image){

formData.append("file",image);

} 

if(replyMessage){

formData.append("replyTo", replyMessage._id);

formData.append("replyText", replyMessage.text || "");

formData.append("replyImage", replyMessage.image || "");

formData.append("replyVoice", replyMessage.voice || "");

formData.append("replyUser", replyMessage.sender);

}
    
for (const pair of formData.entries()) {
    console.log(pair[0], pair[1]);
}
 
const res = await fetch(
"/api/messages/send",
{
method:"POST",
body:formData
}
);

const data = await res.json();

if(data.success){

socket.emit("newMessage",data.message);

document.getElementById("message").value="";
document.getElementById("image").value="";
document.getElementById("previewBox").style.display =
"none";

cancelReply(); 

loadMessages();

const chat = document.getElementById("chat");
chat.scrollTop = chat.scrollHeight;

}else{

alert(data.message);

}

}

socket.on("messageDelivered",(data)=>{

const status =
document.querySelector(
`[data-status="${data.messageId}"]`
);

if(status){

status.innerHTML =
'<i class="fa-solid fa-check-double"></i> Delivered';

}

});

socket.on("messageSeen",(data)=>{

const status =
document.querySelector(
`[data-status="${data.messageId}"]`
);

if(status){

status.innerHTML =
'<i class="fa-solid fa-check-double" style="color:#00b7ff"></i> Seen';

}

});

loadMessages();

socket.on("receiveMessage",(msg)=>{

    if(
        msg.sender===receiver ||
        msg.receiver===receiver
    ){

        loadMessages();

    }

});

socket.on("typing",(data)=>{

const typing = document.getElementById("typing");

typing.style.display = "block";

typing.innerHTML =
`<i class="fa-solid fa-pen"></i> ${data.sender} is typing...`;

});

socket.on("stopTyping",()=>{

document.getElementById("typing").style.display =
"none";

});

const imageInput =
document.getElementById("image");

imageInput.addEventListener("change",()=>{

const file =
imageInput.files[0];

if(!file) return;

const reader =
new FileReader();

reader.onload = function(e){

document.getElementById("previewImage").src =
e.target.result;

document.getElementById("previewBox").style.display =
"block";

};

reader.readAsDataURL(file);

});

function removeImage(){

imageInput.value = "";

document.getElementById("previewBox").style.display =
"none";

}

function showReaction(e, messageId){

    selectedMessage = messageId;

    const popup = document.getElementById("reactionPopup");

    popup.style.display = "flex";

    let x, y;

    if(e.touches){

        x = e.touches[0].pageX;
        y = e.touches[0].pageY;

    }else{

        x = e.pageX;
        y = e.pageY;

    }

    popup.style.left = (x - 120) + "px";
    popup.style.top = (y - 70) + "px";

}

document.addEventListener("click",()=>{

document.getElementById(
"reactionPopup"
).style.display="none";

});

function openImage(image){

    if(!image) return;

    const fullImage = document.getElementById("fullImage");
    const imageViewer = document.getElementById("imageViewer");

    if(!fullImage || !imageViewer) return;

    fullImage.src = image;

    imageViewer.style.display = "flex";

}

function closeImage(){

    const imageViewer = document.getElementById("imageViewer");

    if(imageViewer){

        imageViewer.style.display = "none";

    }

}

async function selectReaction(emoji){

    const popup = document.getElementById("reactionPopup");

    if(popup){

        popup.style.display = "none";

        popup.style.transform = "";

    }

    if(!selectedMessage || !emoji) return;

    try{

        await reactMessage(selectedMessage, emoji);

    }catch(err){

        console.error("Reaction Error:", err);

    }

    selectedMessage = null;

}

async function reactMessage(messageId,emoji){

const res =
await fetch(
"/api/messages/react",
{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({

messageId,

username:user.username,

emoji

})
}
);

const data =
await res.json();

if(data.success){

loadMessages();

}

}

let pressTimer;

function startPress(e,id){

pressTimer=setTimeout(()=>{

showReaction(e,id);

},600);

}

function cancelPress(){

clearTimeout(pressTimer);

}

function startReply(msg){

replyMessage = msg;

let preview = "Message";

if(msg.text){

preview = msg.text;

}else if(msg.image){

preview = "📷 Photo";

}else if(msg.voice){

preview = "🎤 Voice message";

}

document.getElementById("replyText").innerText = preview;

document.getElementById("replyPreview").style.display = "flex";

}

function cancelReply(){

replyMessage = null;

document.getElementById("replyPreview").style.display =
"none";

}

function showMessageMenu(e,msg){

    e.preventDefault();

    selectedMsg = msg;

    const menu = document.getElementById("messageMenu");

    if(msg.sender===user.username){

        document.getElementById("deleteMeOption").style.display="flex";
        document.getElementById("deleteAllOption").style.display="flex";

    }else{

        document.getElementById("deleteMeOption").style.display="none";
        document.getElementById("deleteAllOption").style.display="none";

    }

    menu.style.display="block";

    menu.style.left=e.pageX+"px";
    menu.style.top=e.pageY+"px";

}

function touchStart(e, msg){

    startX = e.touches[0].clientX;

    currentBubble = e.target.closest(".bubble-me, .bubble-other");

    swipeMessage = msg;

    if(currentBubble){
        currentBubble.style.transition = "";
    }

}

function touchMove(e){

    if(!currentBubble) return;

    const moveX = e.touches[0].clientX;

    let diff = moveX - startX;

    // Da zarar ya motsa kadan (5px), fara swipe
    diff = Math.max(0, Math.min(diff, 40));

    currentBubble.style.transform = `translateX(${diff}px)`;

    const icon = currentBubble.querySelector(".reply-icon-inside");

    if(icon){

        icon.style.opacity = Math.min(diff / 20, 1);

        icon.style.transform =
        `translateY(-50%) scale(${0.8 + diff / 80})`;

    }

}

function touchEnd(){

    if(!currentBubble) return;

    const style = currentBubble.style.transform;

    let moved = 0;

    const match = style.match(/translateX\(([\d.]+)px\)/);

    if(match){
        moved = parseFloat(match[1]);
    }

    const icon =
    currentBubble.querySelector(".reply-icon-inside");

    currentBubble.style.transition = ".2s";
    currentBubble.style.transform = "translateX(0px)";

    if(icon){
        icon.style.opacity = "0";
        icon.style.transform = "translateY(-50%) scale(.4)";
    }

    // Da zarar an ja fiye da 5px
    if(moved >= 5){

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

async function startRecording(){

if(recording) return;

try{

const stream = await navigator.mediaDevices.getUserMedia({
audio:true
});

audioChunks = [];

mediaRecorder = new MediaRecorder(stream);

mediaRecorder.ondataavailable = (e)=>{

if(e.data.size > 0){

audioChunks.push(e.data);

}

};

mediaRecorder.onstop = ()=>{

audioBlob = new Blob(audioChunks,{
type:"audio/webm"
});

stream.getTracks().forEach(track=>track.stop());

};

mediaRecorder.start();

recording = true;
paused = false;

document.getElementById("recordIcon").className =
"fa-solid fa-pause";

document.getElementById("message").style.display="none";

document.getElementById("recordingBox").style.display="flex";

document.getElementById("stopRecordBtn").style.display = "block";

// Boye send button yayin recording
document.getElementById("sendBtn").style.display = "none";
    
recordSeconds = 0;

document.getElementById("recordTime").innerText = "00:00";

recordTimer = setInterval(()=>{

recordSeconds++;

const min =
String(Math.floor(recordSeconds/60)).padStart(2,"0");

const sec =
String(recordSeconds%60).padStart(2,"0");

document.getElementById("recordTime").innerText =
`${min}:${sec}`;

},1000);

}catch(err){

console.log(err);

alert("Microphone permission denied.");

}

}

function stopRecording(){

    if(!recording) return;

    recording = false;

    clearInterval(recordTimer);

    document.getElementById("message").style.display = "block";

    document.getElementById("recordingBox").style.display = "none";

    document.getElementById("stopRecordBtn").style.display = "none";

    document.getElementById("recordIcon").className =
    "fa-solid fa-microphone";

    if(mediaRecorder &&
    mediaRecorder.state !== "inactive"){

        mediaRecorder.stop();

    }

    const sendBtn = document.getElementById("sendBtn");

    sendBtn.style.display = "flex";

    sendBtn.innerHTML =
    '<i class="fa-solid fa-paper-plane"></i>';

    sendBtn.onclick = sendVoice;

}

function toggleRecording(){

if(!recording){

startRecording();

return;

}

if(!paused){

pauseRecording();

}else{

resumeRecording();

}

}

function pauseRecording(){

if(!mediaRecorder) return;

mediaRecorder.pause();

paused = true;

clearInterval(recordTimer);

document.getElementById("recordIcon").className =
"fa-solid fa-play";

}

function resumeRecording(){

if(!mediaRecorder) return;

mediaRecorder.resume();

paused = false;

document.getElementById("recordIcon").className =
"fa-solid fa-pause";

recordTimer = setInterval(()=>{

recordSeconds++;

const min =
String(Math.floor(recordSeconds/60)).padStart(2,"0");

const sec =
String(recordSeconds%60).padStart(2,"0");

document.getElementById("recordTime").innerText =
`${min}:${sec}`;

},1000);

}

async function sendVoice(){

    if(!audioBlob) return;

    const formData = new FormData();

    formData.append("voice", audioBlob, "voice.webm");

    formData.append("sender", user.username);

    formData.append("receiver", receiver);

    formData.append("duration", recordSeconds);

    const res = await fetch("/api/messages/voice",{
        method:"POST",
        body:formData
    });

    const data = await res.json();

    if(data.success){

        socket.emit("newMessage", data.message);

        loadMessages();

        audioBlob = null;
        recordSeconds = 0;

        document.getElementById("message").value = "";
        document.getElementById("message").style.display = "block";
        document.getElementById("recordingBox").style.display = "none";

        const sendBtn = document.getElementById("sendBtn");

        sendBtn.innerHTML =
        '<i class="fa-solid fa-paper-plane"></i>';

        sendBtn.onclick = sendMessage;

        document.getElementById("recordIcon").className =
        "fa-solid fa-microphone";

    }else{

        alert(data.message);

    }

}

document.addEventListener("click", function(e){

const playBtn = e.target.closest(".voice-play");

if(!playBtn) return;

const player = playBtn.closest(".voice-player");

const audio = player.querySelector(".voice-audio");

const icon = playBtn.querySelector("i");

const progress = player.querySelector(".voice-progress");

audio.onloadedmetadata = () => {

const total = Math.floor(audio.duration || 0);

const min = Math.floor(total / 60);

const sec = String(total % 60).padStart(2,"0");

player.querySelector(".voice-time").innerText =
`${min}:${sec}`;

};
    
if(audio.paused){

// Dakatar da sauran voice idan akwai
document.querySelectorAll(".voice-audio").forEach(a=>{

if(a!==audio){

a.pause();

a.currentTime = 0;

const p = a.closest(".voice-player");

p.querySelector(".voice-play i").className =
"fa-solid fa-play";

p.querySelector(".voice-progress").style.width = "0%";

const otherBars =
p.querySelectorAll(".voice-bars span");

otherBars.forEach(bar=>{

bar.style.background = "#cfcfcf";

});

}

});

audio.play();

icon.className = "fa-solid fa-pause";

}else{

audio.pause();

icon.className = "fa-solid fa-play";

}


audio.ontimeupdate = ()=>{

const percent =
(audio.currentTime / audio.duration) * 100;

// Progress
progress.style.width = percent + "%";

// Wave bars
const bars =
player.querySelectorAll(".voice-bars span");

bars.forEach((bar,index)=>{

const barPercent =
((index + 1) / bars.length) * 100;

bar.style.background =
barPercent <= percent
? "#25D366"
: "#cfcfcf";

});

// Time
const current =
Math.floor(audio.currentTime);

const min =
Math.floor(current / 60);

const sec =
String(current % 60).padStart(2,"0");

player.querySelector(".voice-time").innerText =
`${min}:${sec}`;

};

audio.onended = ()=>{

icon.className = "fa-solid fa-play";

progress.style.width = "0%";

const bars =
player.querySelectorAll(".voice-bars span");

bars.forEach(bar=>{

bar.style.background = "#cfcfcf";

});

const total =
Math.floor(audio.duration || 0);

const min =
Math.floor(total / 60);

const sec =
String(total % 60).padStart(2,"0");

player.querySelector(".voice-time").innerText =
`${min}:${sec}`;

};

});

function loadVoiceDurations(){

document.querySelectorAll(".voice-audio").forEach(audio=>{

const player = audio.closest(".voice-player");

const time = player.querySelector(".voice-time");

const updateDuration = ()=>{

if(!isFinite(audio.duration) || isNaN(audio.duration)){
return;
}

const total = Math.floor(audio.duration);

const min = Math.floor(total / 60);

const sec = String(total % 60).padStart(2,"0");

time.innerText = `${min}:${sec}`;

};

if(audio.readyState >= 1){

updateDuration();

}else{

audio.addEventListener("loadedmetadata", updateDuration, { once:true });

}

});

}

async function deleteMessage(messageId){

    if(!confirm("Delete this message?")) return;

    const res = await fetch(`/api/messages/${messageId}`,{
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
        loadMessages();
    }else{
        alert(data.message);
    }

}

async function clearChat(){

    if(!confirm("Delete all messages?")) return;

    const res = await fetch(
        `/api/messages/clear/${user.username}/${receiver}`,
        {
            method:"DELETE"
        }
    );

    const data = await res.json();

    if(data.success){

        loadMessages();

    }else{

        alert(data.message);

    }

}

function toggleChatMenu(){

const menu = document.getElementById("chatMenu");

menu.style.display =
menu.style.display === "block"
? "none"
: "block";

}

document.addEventListener("click",(e)=>{

if(
!e.target.closest(".header-btn") &&
!e.target.closest("#chatMenu")
){

document.getElementById("chatMenu").style.display = "none";

}

});

            
function replySelected(){

    startReply(selectedMsg);

    document.getElementById("messageMenu").style.display = "none";

}

function reactSelected(){

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

    deleteMessage(selectedMsg._id);

}

document.addEventListener("click",(e)=>{

    if(!e.target.closest("#messageMenu")){

        document.getElementById("messageMenu").style.display = "none";

    }

});

async function deleteForEveryone(id){

    if(!confirm("Delete this message for everyone?")) return;

    const res = await fetch(
        `/api/messages/delete-everyone/${id}`,
        {
            method:"PUT",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                username:user.username
            })
        }
    );

    const data = await res.json();

    if(data.success){

        loadMessages();

    }else{

        alert(data.message);

    }

}

function deleteEveryoneSelected(){

    document.getElementById("messageMenu").style.display="none";

    deleteForEveryone(selectedMsg._id);

}

document.addEventListener("click",(e)=>{

    if(
        !e.target.closest("#reactionPopup") &&
        !e.target.closest(".message-menu")
    ){

        const popup = document.getElementById("reactionPopup");

        popup.style.display = "none";

        popup.style.transform = "";

    }

});

