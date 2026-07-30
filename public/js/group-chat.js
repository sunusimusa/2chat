const socket = io();

alert("JS Loaded");

const user =
JSON.parse(localStorage.getItem("user"));

if(!user){

location.href="/login.html";

}

const params =
new URLSearchParams(window.location.search);

const groupId =
params.get("id");

const chat =
document.getElementById("groupChat");

const messageInput =
document.getElementById("message");

const sendBtn =
document.getElementById("sendBtn");

/* ==========================
LOAD GROUP INFO
========================== */

async function loadGroup(){

    try{

        const res =
        await fetch("/api/groups/" + groupId);

        const data =
        await res.json();

        if(!data.success){

            alert("Group not found");

            history.back();

            return;

        }

        document.getElementById("groupName").innerText =
        data.group.name;

        document.getElementById("groupMembers").innerText =
        data.group.memberCount + " Members";

        document.getElementById("groupAvatar").src =
        data.group.avatar || "/images/default-group.png";

    }catch(err){

        console.error(err);

        alert("Failed to load group.");

    }

}

/* ==========================
LOAD MESSAGES
========================== */

async function loadMessages(){

    try{

        const res =
        await fetch("/api/group-messages/" + groupId);

        const data =
        await res.json();

        if(!data.success){

            chat.innerHTML = "";

            return;

        }

        chat.innerHTML = "";

if(Array.isArray(data.messages)){

    data.messages.forEach(msg=>{

        appendMessage(msg);

    });

}

        chat.scrollTop = chat.scrollHeight;

    }catch(err){

        console.error(err);

    }

}

/* ==========================
APPEND MESSAGE
========================== */

function appendMessage(msg){

const mine =
msg.sender===user.username;

chat.insertAdjacentHTML(

"beforeend",

`

<div class="${mine?"me":"other"}">

<div class="${mine?"bubble-me":"bubble-other"}">

${msg.image?

`<div class="message-image">

<img src="${msg.image}">

</div>`

:""}

${msg.text||""}

<div class="message-time">

${new Date(msg.createdAt).toLocaleTimeString([],{

hour:"2-digit",

minute:"2-digit"

})}

</div>

</div>

</div>

`

);

}

/* ==========================
AUTO RESIZE
========================== */

messageInput.addEventListener("input",()=>{

messageInput.style.height="auto";

messageInput.style.height=
messageInput.scrollHeight+"px";

});

/* ==========================
START
========================== */

loadGroup();

loadMessages();

alert("Finished Loading");

/* ==========================
SEND MESSAGE
========================== */

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown",(e)=>{

    if(e.key==="Enter" && !e.shiftKey){

        e.preventDefault();

        sendMessage();

    }

});

async function sendMessage(){

    const text =
    messageInput.value.trim();

    if(text==="") return;

    try{

        const res =
        await fetch("/api/group-messages/send",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                groupId,

                sender:user.username,

                text

            })

        });

        const data =
        await res.json();

        if(!data.success){

            alert(data.message);

            return;

        }

        appendMessage(data.message);

        socket.emit("groupMessage", data.message);

        messageInput.value="";

        messageInput.style.height="auto";

        chat.scrollTop=
        chat.scrollHeight;

    }catch(err){

        console.error(err);

    }

}

/* ==========================
SOCKET
========================== */

socket.emit("joinGroup", groupId);

socket.on("newGroupMessage",(msg)=>{

    if(msg.sender===user.username) return;

    appendMessage(msg);

    chat.scrollTop=
    chat.scrollHeight;

});


/* ==========================
GROUP INFO BUTTON
========================== */

document
.getElementById("groupInfoBtn")
.addEventListener("click",()=>{

    location.href =
    "/group-info.html?id=" + groupId;

});

function removeImage(){

    document.getElementById("previewBox").style.display = "none";

    document.getElementById("groupImage").value = "";

}


            
