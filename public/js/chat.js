const user = JSON.parse(localStorage.getItem("user"));

let selectedMessage = null;
let replyMessage = null;

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

const chat = document.getElementById("chat");

const mine = msg.sender === user.username;

const div = document.createElement("div");

div.className = mine ? "me" : "other";

div.innerHTML = `

<div
class="${mine ? "bubble-me" : "bubble-other"}"
oncontextmenu="showMessageMenu(event,${JSON.stringify(msg).replace(/"/g,"&quot;")})"
ontouchstart="startPress(event,'${msg._id}')"
ontouchend="cancelPress()"
>

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
msg.replyText
? msg.replyText
: msg.replyImage
? "📷 Photo"
: msg.replyVoice
? "🎤 Voice message"
: "Message"
}

</div>

</div>

`

:

""

}

${msg.text || ""}

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

chat.appendChild(div);

chat.scrollTop = chat.scrollHeight;

}

async function loadMessages(autoScroll=true){
    
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
oncontextmenu="showMessageMenu(event,${JSON.stringify(msg).replace(/"/g,"&quot;")})"
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
msg.replyText
? msg.replyText
: msg.replyImage
? "📷 Photo"
: msg.replyVoice
? "🎤 Voice message"
: "Message"
}

</div>

</div>

`

:

""

}

${msg.text || ""}

<div class="message-time">
${new Date(msg.createdAt).toLocaleTimeString([],{
hour:"2-digit",
minute:"2-digit"
})}
</div>

${
mine
?
`
<br>

<small
class="message-status"
data-status="${msg._id}">

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

</div>

`;

});

const chat =
document.getElementById("chat");

if(chat.innerHTML !== html){

chat.innerHTML = html;

if(autoScroll){

chat.scrollTop = chat.scrollHeight;

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

appendMessage(msg);

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

const action =
prompt(
"1 = Reply\n2 = React"
);

if(action==="1"){

startReply(msg);

}else if(action==="2"){

showReaction(e,msg._id);

}

}


