const socket = io();

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

        const res = await fetch("/api/groups/" + groupId);
        
        const data = await res.json();

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

        if(data.messages){

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

    const text = messageInput.value.trim();

if(text==="" && !selectedImage) return;

const formData = new FormData();

formData.append("groupId", groupId);
formData.append("sender", user.username);
formData.append("text", text);

if(selectedImage){

    formData.append("image", selectedImage);

}
    
    try{

        const res =
await fetch("/api/group-messages/send",{

    method:"POST",

    body:formData

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

        removeImage();

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

    selectedImage = null;

    groupImage.value = "";

    document.getElementById("previewImage").src = "";

    document.getElementById("previewBox").style.display = "none";

}

const groupImage =
document.getElementById("groupImage");

let selectedImage = null;

groupImage.addEventListener("change",(e)=>{

    const file = e.target.files[0];

    if(!file) return;

    selectedImage = file;

    const reader = new FileReader();

    reader.onload = function(){

        document.getElementById("previewImage").src =
        reader.result;

        document.getElementById("previewBox").style.display =
        "block";

    };

    reader.readAsDataURL(file);

});
         
