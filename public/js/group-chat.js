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
const recordBtn =
document.getElementById("recordBtn");

let mediaRecorder;

let audioChunks = [];

let recordedVoice = null;
const voicePreview =
document.getElementById("voicePreview");

const voicePlayer =
document.getElementById("voicePlayer");

const deleteVoice =
document.getElementById("deleteVoice");

let isRecording = false;

let recordTime = 0;

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

${
msg.image
?

`<div class="message-image">

<img
src="${msg.image}"
loading="lazy"
onclick="openImage('${msg.image}')">

</div>`

:

""

}

${
msg.text
?

`<div class="message-text">

${msg.text}

</div>`

:

""
}

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
    
    alert("SEND CLICKED");

    const text = messageInput.value.trim();
    console.log("Text:", text);
console.log("Image:", selectedImage);
console.log("Voice:", recordedVoice);

if(text==="" && !selectedImage && !recordedVoice){

    return;

}
const formData = new FormData();

formData.append("groupId", groupId);
formData.append("sender", user.username);
formData.append("text", text);

if(selectedImage){

    formData.append(
        "image",
        selectedImage
    );

}

if(recordedVoice){

    formData.append(
        "image",
        recordedVoice,
        "voice.webm"
    );

    formData.append(
        "voiceDuration",
        recordTime
    );

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

messageInput.value = "";

removeImage();

// Clear recorded voice
recordedVoice = null;

voicePlayer.src = "";

voicePreview.style.display = "none";

messageInput.style.height = "auto";

chat.scrollTop = chat.scrollHeight;
        
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

/* ==========================
IMAGE VIEWER
========================== */

const imageViewer =
document.getElementById("imageViewer");

const viewerImage =
document.getElementById("viewerImage");

const closeViewer =
document.getElementById("closeViewer");

function openImage(src){

    viewerImage.src = src;

    imageViewer.classList.add("show");

}

function closeImage(){

    imageViewer.classList.remove("show");

}

closeViewer.onclick = closeImage;

imageViewer.onclick = function(e){

    if(e.target === imageViewer){

        closeImage();

    }

};

/* ==========================
VOICE RECORD
========================== */

recordBtn.addEventListener("mousedown", startRecording);

recordBtn.addEventListener("mouseup", stopRecording);

recordBtn.addEventListener("touchstart",(e)=>{

    e.preventDefault();

    startRecording();

});

recordBtn.addEventListener("touchend",(e)=>{

    e.preventDefault();

    stopRecording();

});

async function startRecording(){

    if(isRecording) return;

    try{

        const stream =
        await navigator.mediaDevices.getUserMedia({

            audio:true

        });

        mediaRecorder =
        new MediaRecorder(stream);

        audioChunks = [];

        recordTime = 0;

        mediaRecorder.ondataavailable = (e)=>{

            audioChunks.push(e.data);

        };

        mediaRecorder.onstart = ()=>{

            mediaRecorder.timer = setInterval(()=>{

                recordTime++;

            },1000);

        };

        mediaRecorder.onstop = ()=>{

            clearInterval(mediaRecorder.timer);

            recordedVoice =
            new Blob(audioChunks,{

                type:"audio/webm"

            });

            voicePlayer.src =
            URL.createObjectURL(recordedVoice);

            voicePreview.style.display = "flex";

        };

        mediaRecorder.start();

        isRecording = true;

        recordBtn.style.background = "red";

    }catch(err){

        console.error(err);

        alert("Microphone Permission Denied");

    }

}

function stopRecording(){

    if(!isRecording) return;

    mediaRecorder.stop();

    isRecording = false;

    recordBtn.style.background = "";

}

deleteVoice.onclick = ()=>{

    recordedVoice = null;

    voicePlayer.src = "";

    voicePreview.style.display = "none";

};
