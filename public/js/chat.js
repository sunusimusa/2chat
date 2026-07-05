const user = JSON.parse(localStorage.getItem("user"));

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

const mine =
msg.sender===user.username;
html+=`

<div class="${mine?"me":"other"}">

<div class="${mine?"bubble-me":"bubble-other"}">

<div>

${
msg.reactions && msg.reactions.length

?

msg.reactions.map(r=>`

<span
style="
font-size:22px;
margin-right:5px;
cursor:pointer;
">

${r.emoji}

</span>

`).join("")

:

""

}

</div>

${
msg.image
?
`<img
src="${msg.image}"
onclick="openImage('${msg.image}')"
style="
width:100%;
max-width:220px;
height:auto;
border-radius:12px;
display:block;
margin-bottom:8px;
cursor:pointer;
">`
:
""
}

${msg.text}

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

chat.innerHTML=html;

chat.scrollTop=
chat.scrollHeight;

}

async function sendMessage(){

const text =
document.getElementById("message").value.trim();

const image =
document.getElementById("image").files[0];

if(text==="" && !image){
return;
}

const formData = new FormData();

formData.append("sender",user.username);
formData.append("receiver",receiver);
formData.append("text",text);

if(image){
formData.append("image",image);
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

}

function openImage(image){

document.getElementById("fullImage").src = image;

document.getElementById("imageViewer").style.display = "flex";

}

function closeImage(){

document.getElementById("imageViewer").style.display = "none";

}
