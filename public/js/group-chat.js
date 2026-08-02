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
        msg.sender === user.username;

    // ==========================
    // VOICE
    // ==========================

    let voiceHTML = "";

    if(msg.voice){

        const duration =
            Number(msg.voiceDuration || 0);

        voiceHTML = `
            <div class="voice-message">

                <audio
                    controls
                    preload="metadata"
                    src="${msg.voice}">
                </audio>

                <span class="voice-duration">
                    ${duration}s
                </span>

            </div>
        `;

    }

    // ==========================
    // IMAGE
    // ==========================

    let imageHTML = "";

    if(msg.image){

        imageHTML = `
            <div class="message-image">

                <img
                    src="${msg.image}"
                    onclick="openImageViewer('${msg.image}')">

            </div>
        `;

    }

    // ==========================
    // TEXT
    // ==========================

    let textHTML = "";

    if(msg.text){

        textHTML = `
            <div class="message-text">
                ${msg.text}
            </div>
        `;

    }

    // ==========================
    // REACTIONS
    // ==========================

    let reactionsHTML = "";

    if(
        msg.reactions &&
        msg.reactions.length > 0
    ){

        reactionsHTML = `
            <div class="message-reactions">

                ${msg.reactions.map(
                    reaction => `
                        <span
                            class="reaction-item">
                            ${reaction.emoji}
                        </span>
                    `
                ).join("")}

            </div>
        `;

    }

    // ==========================
    // MESSAGE
    // ==========================

    chat.insertAdjacentHTML(

        "beforeend",

        `
        
        <div
    class="${mine ? "me" : "other"}"
    data-message-id="${msg._id}"
    data-sender="${msg.sender || ""}"
    data-text="${encodeURIComponent(msg.text || "")}"
    data-image="${encodeURIComponent(msg.image || "")}"
    data-voice="${encodeURIComponent(msg.voice || "")}"
    oncontextmenu="openReplyMenu(event, this)"
>

            <div class="${
                mine
                ? "bubble-me"
                : "bubble-other"
            }">

                ${imageHTML}

                ${voiceHTML}

                ${textHTML}

                <div class="message-time">

                    ${new Date(
                        msg.createdAt
                    ).toLocaleTimeString([],{

                        hour:"2-digit",
                        minute:"2-digit"

                    })}

                </div>

                ${reactionsHTML}

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

    console.log("Text:", text);
    console.log("Image:", selectedImage);
    console.log("Voice:", recordedVoice);

    // ==========================
    // CHECK MESSAGE
    // ==========================

    if(
        text === "" &&
        !selectedImage &&
        !recordedVoice
    ){

        return;

    }

    // ==========================
    // FORM DATA
    // ==========================

    const formData = new FormData();

    formData.append(
        "groupId",
        groupId
    );

    formData.append(
        "sender",
        user.username
    );

    formData.append(
        "text",
        text
    );

    // ==========================
    // IMAGE
    // ==========================

    if(selectedImage){

        formData.append(
            "image",
            selectedImage
        );

    }

    // ==========================
    // VOICE
    // ==========================

    if(recordedVoice){

        formData.append(
            "voice",
            recordedVoice,
            "voice.webm"
        );

        formData.append(
            "voiceDuration",
            recordTime
        );

    }

    // ==========================
    // SEND
    // ==========================

    try{

        const res = await fetch(
            "/api/group-messages/send",
            {
                method:"POST",
                body:formData
            }
        );

        // ==========================
        // READ RESPONSE
        // ==========================

        const responseText =
            await res.text();

        console.log(
            "Server Response:",
            responseText
        );

        let data;

        try{

            data =
                JSON.parse(responseText);

        }catch(parseError){

            console.error(
                "Invalid JSON response:",
                parseError
            );

            alert(
                "Server returned an invalid response."
            );

            return;

        }

        // ==========================
        // SERVER ERROR
        // ==========================

        if(!res.ok || !data.success){

            alert(
                data.message ||
                "Message failed to send."
            );

            return;

        }

        // ==========================
        // SHOW MESSAGE
        // ==========================

        appendMessage(
            data.message
        );

        // ==========================
        // SOCKET
        // ==========================

        socket.emit(
            "groupMessage",
            data.message
        );

        // ==========================
        // CLEAR TEXT
        // ==========================

        messageInput.value = "";

        messageInput.style.height =
            "auto";

        // ==========================
        // CLEAR IMAGE
        // ==========================

        removeImage();

        // ==========================
        // CLEAR VOICE
        // ==========================

        recordedVoice = null;

        if(voicePlayer){

            voicePlayer.pause();

            voicePlayer.removeAttribute(
                "src"
            );

            voicePlayer.load();

        }

        if(voicePreview){

            voicePreview.style.display =
                "none";

        }

        // Reset recording time
        recordTime = 0;

        // ==========================
        // SCROLL CHAT
        // ==========================

        chat.scrollTop =
            chat.scrollHeight;

        console.log(
            "Message sent successfully."
        );

    }catch(err){

        console.error(
            "SEND MESSAGE ERROR:",
            err
        );

        alert(
            "Failed to send message."
        );

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

/* ==========================
GROUP MESSAGE REACTION
========================== */

socket.on("groupMessageReaction", (message) => {

    if(!message || !message._id){
        return;
    }

    updateMessageReactions(message);

});

function updateMessageReactions(message){

    const messageElement =
        document.querySelector(
            `[data-message-id="${message._id}"]`
        );

    if(!messageElement){
        return;
    }

    let reactionBox =
        messageElement.querySelector(
            ".message-reactions"
        );

    // ==========================
    // CREATE REACTION BOX
    // ==========================

    if(!reactionBox){

        reactionBox =
            document.createElement("div");

        reactionBox.className =
            "message-reactions";

        const bubble =
            messageElement.querySelector(
                ".bubble-me, .bubble-other"
            );

        if(bubble){

            bubble.appendChild(
                reactionBox
            );

        }

    }

    // ==========================
    // NO REACTIONS
    // ==========================

    if(
        !message.reactions ||
        message.reactions.length === 0
    ){

        reactionBox.innerHTML = "";

        reactionBox.style.display =
            "none";

        return;

    }

    // ==========================
    // SHOW REACTIONS
    // ==========================

    reactionBox.innerHTML = "";

    reactionBox.style.display =
        "flex";

    message.reactions.forEach(
        reaction => {

            const span =
                document.createElement("span");

            span.className =
                "reaction-item";

            span.innerText =
                reaction.emoji;

            reactionBox.appendChild(
                span
            );

        }
    );

}

/* ==========================
   REACTION PICKER
========================== */

const reactionPicker =
    document.getElementById("reactionPicker");

let reactionMessageId = null;


function showReactionPicker(messageElement){

    reactionMessageId =
        messageElement.dataset.messageId;

    const rect =
        messageElement.getBoundingClientRect();

    reactionPicker.style.left =
        Math.max(
            10,
            rect.left
        ) + "px";

    reactionPicker.style.top =
        Math.max(
            10,
            rect.top - 55
        ) + "px";

    reactionPicker.classList.add("show");

}


function hideReactionPicker(){

    reactionPicker.classList.remove("show");

    reactionMessageId = null;

}

function openReactionPicker(e, messageElement){

    e.preventDefault();

    showReactionPicker(messageElement);

}

/* ==========================
   SEND MESSAGE REACTION
========================== */

reactionPicker
    .querySelectorAll("button")
    .forEach(button => {

        button.addEventListener("click", async () => {

            const emoji =
                button.dataset.emoji;

            if(!reactionMessageId){

                hideReactionPicker();

                return;

            }

            try{

                const res =
                    await fetch(
                        "/api/group-messages/react",
                        {
                            method:"PUT",

                            headers:{
                                "Content-Type":
                                    "application/json"
                            },

                            body:JSON.stringify({

                                messageId:
                                    reactionMessageId,

                                username:
                                    user.username,

                                emoji:
                                    emoji

                            })
                        }
                    );

                const data =
                    await res.json();

                if(!res.ok || !data.success){

                    alert(
                        data.message ||
                        "Reaction failed."
                    );

                    return;

                }

                // ==========================
                // UPDATE MESSAGE
                // ==========================

                updateMessageReactions(
                    data.message
                );

                // ==========================
                // SEND TO GROUP
                // ==========================

                socket.emit(
                    "groupMessageReaction",
                    data.message
                );

                hideReactionPicker();

            }catch(err){

                console.error(
                    "REACTION ERROR:",
                    err
                );

                alert(
                    "Failed to send reaction."
                );

            }

        });

    });

/* ==========================
   REPLY PREVIEW UI
========================== */

const replyPreview =
    document.getElementById("replyPreview");

const replyUser =
    document.getElementById("replyUser");

const replyPreviewText =
    document.getElementById("replyPreviewText");

const cancelReply =
    document.getElementById("cancelReply");

let replyMessage = null;


function startReply(message){

    replyMessage = message;

    replyUser.textContent =
        message.sender || "";

    if(message.text){

        replyPreviewText.textContent =
            message.text;

    }else if(message.image){

        replyPreviewText.textContent =
            "📷 Photo";

    }else if(message.voice){

        replyPreviewText.textContent =
            "🎤 Voice message";

    }else{

        replyPreviewText.textContent =
            "Message";

    }

    replyPreview.style.display =
        "flex";

    messageInput.focus();

}


function cancelReplyMessage(){

    replyMessage = null;

    replyPreview.style.display =
        "none";

    replyUser.textContent =
        "";

    replyPreviewText.textContent =
        "";

}


cancelReply.addEventListener(
    "click",
    cancelReplyMessage
);

/* ==========================
   REPLY MESSAGE
========================== */

function openReplyMenu(event, messageElement){

    event.preventDefault();

    const messageId =
        messageElement.dataset.messageId;

    const message =
        findMessageById(messageId);

    if(!message){
        return;
    }

    startReply(message);
}


function findMessageById(messageId){

    const messageElement =
        document.querySelector(
            `[data-message-id="${messageId}"]`
        );

    if(!messageElement){
        return null;
    }

    return {
        _id: messageId,

        sender:
            messageElement.classList.contains("me")
                ? user.username
                : "User",

        text:
            messageElement
                .querySelector(".message-text")
                ?.textContent
                .trim() || "",

        image:
            messageElement
                .querySelector(".message-image img")
                ?.src || "",

        voice:
            messageElement
                .querySelector(".voice-message audio")
                ?.src || ""
    };

}

/* ==========================
   OPEN REPLY
========================== */

function openReplyMenu(event, messageElement){

    event.preventDefault();

    const message = {

        _id:
            messageElement.dataset.messageId,

        sender:
            messageElement.dataset.sender || "",

        text:
            decodeURIComponent(
                messageElement.dataset.text || ""
            ),

        image:
            decodeURIComponent(
                messageElement.dataset.image || ""
            ),

        voice:
            decodeURIComponent(
                messageElement.dataset.voice || ""
            )

    };

    startReply(message);

}
