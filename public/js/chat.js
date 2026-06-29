const user =
JSON.parse(localStorage.getItem("user"));

const socket = io();

socket.emit("join", user.username);

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

const params =
new URLSearchParams(window.location.search);

const receiver =
params.get("user");

document.getElementById("chatUser").innerText =
receiver;

async function loadMessages(){

if(!receiver) return;

const res =
await fetch(
`/api/messages/chat?sender=${user.username}&receiver=${receiver}`
);

const data =
await res.json();

let html="";

data.messages.forEach(msg=>{

const mine =
msg.sender===user.username;
html+=`

<div class="${mine?"me":"other"}">

<div class="${mine?"bubble-me":"bubble-other"}">

${msg.text}

${
mine
?
`<br>
<small style="font-size:11px;opacity:.8;">
${msg.seen ? "👁 Seen" : "✓ Sent"}
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

if(text==="") return;

const res =
await fetch(
"/api/messages/send",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
sender:user.username,
receiver:receiver,
text:text
})
}
);

const data =
await res.json();

if(data.success){

socket.emit("newMessage",{
sender:user.username,
receiver,
text
});

document.getElementById("message").value="";

loadMessages();

}else{

alert(data.message);

}

}

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


messageBox.addEventListener("input",()=>{

socket.emit("typing",{
sender:user.username,
receiver:receiver
});

clearTimeout(typingTimeout);

typingTimeout = setTimeout(()=>{

socket.emit("stopTyping",{
sender:user.username,
receiver:receiver
});

},1000);

});


