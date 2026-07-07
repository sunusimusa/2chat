const user = JSON.parse(localStorage.getItem("user"));

let selectedMessage = null;

let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let recording = false;

if (!user) {
    location.href = "/login.html";
}

const socket = io();

socket.emit("join", user.username);

const params = new URLSearchParams(window.location.search);

const receiver = params.get("user");

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

document.getElementById("status").innerText =
"🟢 Online";

}

});

socket.on("userOffline",(username)=>{

if(username===receiver){

document.getElementById("status").innerText =
"Last seen recently";

}

});

async function loadMessages(){

if(!receiver) return;

const res =
await fetch(
`/api/messages/chat?sender=${user.username}&receiver=${receiver}`
);

const data =
await res.json();

data.messages.forEach(msg=>{

if(
msg.receiver===user.username &&
!msg.seen
){

socket.emit("messageSeen",{
sender:msg.sender,
messageId:msg._id
});

}

});

let html="";

data.messages.forEach(msg=>{

const mine = msg.sender===user.username;

html += `

<div class="${mine ? "me" : "other"}">

<div
class="${mine ? "bubble-me" : "bubble-other"}"
oncontextmenu="showReaction(event,'${msg._id}')"
ontouchstart="startPress(event,'${msg._id}')"
ontouchend="cancelPress()"
>

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

${msg.voice
?
`
<audio
controls
style="
width:220px;
margin:8px 0;
">
<source
src="${msg.voice}"
type="audio/webm">
</audio>
`
:
""
}

${msg.text || ""}

${
mine
?
`<br>
<small style="font-size:11px;opacity:.8;">
${
msg.seen
?
"✓✓ Seen"
:
msg.delivered
?
"✓✓ Delivered"
:
"✓ Sent"
}
</small>`
:
""
}

</div>

</div>

`;

});

const chat =
document.getElementById("chat");

chat.innerHTML = html;

chat.scrollTop = chat.scrollHeight;

}

async function sendMessage(){

const text =
document.getElementById("message").value.trim();

const image =
document.getElementById("image").files[0];
    
const voice = audioBlob;  

if(text==="" && !image && !voice){
    return;
}

const formData = new FormData();

formData.append("sender",user.username);
formData.append("receiver",receiver);
formData.append("text",text);

if(image){

formData.append("file",image);

}

else if(voice){

formData.append(
"file",
voice,
"voice.webm"
);

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

audioBlob = null;

document.getElementById("voicePreview").style.display="none";

document.getElementById("voicePreview").src="";    

loadMessages();
    
}else{

alert(data.message);

}

}

socket.on("messageDelivered",()=>{

loadMessages();

});

socket.on("messageSeen",()=>{

loadMessages();

});

loadMessages();

setInterval(loadMessages,2000);

socket.on("receiveMessage",(msg)=>{

if(
msg.sender===receiver ||
msg.receiver===receiver
){

loadMessages();

}

});

socket.on("typing",(data)=>{

document.getElementById("typing").style.display =
"block";

document.getElementById("typing").innerText =
"✍️ " + data.sender + " is typing...";

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

audioBlob = null;

document.getElementById("voicePreview").src = "";    

}

function showReaction(e,id){

selectedMessage=id;

const popup=
document.getElementById("reactionPopup");

popup.style.display="block";

const x =
e.touches
?
e.touches[0].pageX
:
e.pageX;

const y =
e.touches
?
e.touches[0].pageY
:
e.pageY;

popup.style.left=x+"px";

popup.style.top=(y-60)+"px";

e.preventDefault();

}

document.addEventListener("click",()=>{

document.getElementById(
"reactionPopup"
).style.display="none";

});

function openImage(image){

document.getElementById("fullImage").src = image;

document.getElementById("imageViewer").style.display = "flex";

}

function closeImage(){

document.getElementById("imageViewer").style.display = "none";

}

async function selectReaction(emoji){

document.getElementById(
"reactionPopup"
).style.display="none";

await reactMessage(
selectedMessage,
emoji
);

selectedMessage=null;

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

async function toggleRecording(){

if(!recording){

const stream = await navigator.mediaDevices.getUserMedia({
audio:true
});

mediaRecorder = new MediaRecorder(stream);

audioChunks = [];

mediaRecorder.start();

recording = true;

document.getElementById("recordBtn").innerText = "⏹";

mediaRecorder.ondataavailable = (e)=>{

audioChunks.push(e.data);

};

mediaRecorder.onstop = () => {

    audioBlob = new Blob(audioChunks, {
        type: "audio/webm"
    });

    const url = URL.createObjectURL(audioBlob);

    const player = document.getElementById("voicePreview");

    player.src = url;

    player.load(); // Muhimmi

    player.style.display = "block";

};

}else{

mediaRecorder.stop();

recording = false;

document.getElementById("recordBtn").innerText = "🎤";

}

}
