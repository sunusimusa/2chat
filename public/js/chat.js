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


