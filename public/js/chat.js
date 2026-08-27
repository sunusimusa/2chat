/* ==========================
   2Chat Messenger
   CHAT.JS
========================== */

const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    location.href = "/login.html";
}

const socket = io();

const params = new URLSearchParams(location.search);
const receiver = params.get("user");


/* ==========================
   GLOBAL VARIABLES
========================== */

let selectedMessage = null;
let selectedMsg = null;

let replyMessage = null;

let currentBubble = null;
let swipeMessage = null;
let startX = 0;


/* ==========================
   VOICE VARIABLES
========================== */

let mediaRecorder = null;
let audioChunks = [];

let audioBlob = null;
let audioUrl = null;

let recording = false;
let recordSeconds = 0;
let recordTimer = null;


/* ==========================
   DOM
========================== */

const chat = document.getElementById("chat");

const messageInput =
    document.getElementById("message");

const imageInput =
    document.getElementById("image");

const sendBtn =
    document.getElementById("sendBtn");

const sendIcon =
    document.getElementById("sendIcon");

const recordingBox =
    document.getElementById("recordingBox");

const recordTime =
    document.getElementById("recordTime");

const recordText =
    document.getElementById("recordText");

const recordDot =
    document.getElementById("recordDot");

const voicePreviewBox =
    document.getElementById("voicePreviewBox");

const voicePreview =
    document.getElementById("voicePreview");

const voicePlayIcon =
    document.getElementById("voicePlayIcon");

const voiceActionBtn =
    document.getElementById("voiceActionBtn");

const voiceActionIcon =
    document.getElementById("voiceActionIcon");


/* ==========================
   RENDER MESSAGE
========================== */

function renderMessage(msg) {

    const mine =
        msg.sender === user.username;

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

<img
src="${msg.image}"
onclick="openImage('${msg.image}')">

</div>

` : ""}


${msg.replyTo ? `

<div class="reply-bubble">

<div class="reply-user">
↩ ${msg.replyUser || ""}
</div>

<div class="reply-message">
${msg.replyText || "Message"}
</div>

</div>

` : ""}


${msg.deletedForEveryone ?

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

<button
class="voice-play"
onclick="playMessageVoice(this)">

<i class="fa-solid fa-play"></i>

</button>

<div class="voice-wave">

<div class="voice-progress"></div>

</div>

<span class="voice-time">
0:00
</span>

<audio
class="voice-audio"
preload="metadata"
src="${msg.voice}">
</audio>

</div>

`

:

`

${msg.text || ""}

`

}


${msg.reactions && msg.reactions.length ? `

<div class="message-reactions">

${msg.reactions.map(r => `

<span class="reaction">
${r.emoji}
</span>

`).join("")}

</div>

` : ""}


<div class="message-time">

${msg.createdAt ?

new Date(msg.createdAt).toLocaleTimeString([], {

hour: "2-digit",
minute: "2-digit"

})

: ""}

</div>


${mine ?

`

<small class="message-status">

${

msg.seen

?

'<i class="fa-solid fa-check-double" style="color:#00b7ff"></i>'

:

msg.delivered

?

'<i class="fa-solid fa-check-double"></i>'

:

'<i class="fa-solid fa-check"></i>'

}

</small>

`

: ""}


</div>

</div>

`;

}


/* ==========================
   LOAD CHAT USER
========================== */

async function loadChatUser() {

    if (!receiver) return;

    try {

        const res =
            await fetch(
                `/api/users/profile/${receiver}`
            );

        const data =
            await res.json();

        if (!data.success) return;

        const chatUser =
            data.user;

        const name =
            document.getElementById("chatName");

        const avatar =
            document.getElementById("chatAvatar");

        const status =
            document.getElementById("status");

        if (name) {
            name.innerText =
                chatUser.username;
        }

        if (avatar) {
            avatar.src =
                chatUser.avatar ||
                "/images/default.png";
        }

        if (status) {

            if (chatUser.online) {

                status.innerHTML =
                    '<i class="fa-solid fa-circle online-dot"></i> Online';

            } else {

                status.innerHTML =
                    '<i class="fa-regular fa-clock"></i> Offline';

            }

        }

    } catch (err) {

        console.error(
            "Load Chat User Error:",
            err
        );

    }

}


/* ==========================
   LOAD MESSAGES
========================== */

async function loadMessages(
    autoScroll = true
) {

    if (!receiver) return;

    try {

        const res =
            await fetch(
                `/api/messages/chat?sender=${user.username}&receiver=${receiver}`
            );

        const data =
            await res.json();

        if (!data.success) {

            chat.innerHTML = "";

            return;

        }

        const messages =
            data.messages || [];

        chat.innerHTML = "";

        messages.forEach(msg => {

            chat.insertAdjacentHTML(
                "beforeend",
                renderMessage(msg)
            );

            if (
                msg.receiver === user.username &&
                !msg.seen
            ) {

                socket.emit(
                    "messageSeen",
                    {
                        sender: msg.sender,
                        messageId: msg._id
                    }
                );

            }

        });


        if (autoScroll) {

            requestAnimationFrame(() => {

                chat.scrollTop =
                    chat.scrollHeight;

            });

        }

    } catch (err) {

        console.error(
            "Load Messages Error:",
            err
        );

    }

}


/* ==========================
   APPEND MESSAGE
========================== */

function appendMessage(msg) {

    if (!msg) return;

    chat.insertAdjacentHTML(
        "beforeend",
        renderMessage(msg)
    );

    requestAnimationFrame(() => {

        chat.scrollTop =
            chat.scrollHeight;

    });

}


/* ==========================================================
   SEND TEXT / IMAGE
========================================================== */

async function sendMessage() {

    const text =
        messageInput.value.trim();

   const image =
    imageInput.files &&
    imageInput.files.length > 0
        ? imageInput.files[0]
        : null;

    
    if (
        text === "" &&
        !image &&
        !replyMessage
    ) {
        return;
    }


    const formData =
        new FormData();

    formData.append(
        "sender",
        user.username
    );

    formData.append(
        "receiver",
        receiver
    );

    formData.append(
        "text",
        text
    );


    if (image) {

        formData.append(
            "file",
            image
        );

    }


    if (replyMessage) {

        formData.append(
            "replyTo",
            replyMessage._id || ""
        );

        formData.append(
            "replyUser",
            replyMessage.sender || ""
        );

        formData.append(
            "replyText",
            replyMessage.text || ""
        );

        formData.append(
            "replyImage",
            replyMessage.image || ""
        );

        formData.append(
            "replyVoice",
            replyMessage.voice || ""
        );

    }


    try {

        sendBtn.disabled = true;


        const res =
            await fetch(
                "/api/messages/send",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await res.json();


        if (!data.success) {

            alert(
                data.message ||
                "Failed to send message"
            );

            return;

        }


        appendMessage(
            data.message
        );


        socket.emit(
            "newMessage",
            data.message
        );


        messageInput.value = "";

        imageInput.value = "";


        replyMessage = null;


        const preview =
            document.getElementById(
                "replyPreview"
            );

        if (preview) {

            preview.style.display =
                "none";

        }


        const previewBox =
            document.getElementById(
                "previewBox"
            );

        if (previewBox) {

            previewBox.style.display =
                "none";

        }


        updateSendButton();


    } catch (err) {

        console.error(
            "Send Message Error:",
            err
        );

        alert(
            "Network Error"
        );

    } finally {

        sendBtn.disabled = false;

    }

}


/* ==========================================================
   SINGLE SEND BUTTON
========================================================== */

function handleSendAction() {

    const text =
        messageInput.value.trim();

    const image =
        imageInput.files &&
        imageInput.files.length > 0
            ? imageInput.files[0]
            : null;


    // ==========================
    // TEXT → SEND
    // ==========================

    if (text !== "") {

        sendMessage();

        return;
    }


    // ==========================
    // IMAGE → SEND
    // ==========================

    if (image) {

        sendMessage();

        return;
    }


    // ==========================
    // NOTHING → VOICE
    // ==========================

    startRecording();
}

/* ==========================
   UPDATE SEND ICON
========================== */

function updateSendButton() {

    if (!sendIcon) return;

    const hasText =
        messageInput.value.trim() !== "";

    const hasImage =
        imageInput.files.length > 0;


    if (
        hasText ||
        hasImage
    ) {

        sendIcon.className =
            "fa-solid fa-paper-plane";

    } else {

        sendIcon.className =
            "fa-solid fa-microphone";

    }

}


/* ==========================
   ENTER TO SEND
========================== */

messageInput.addEventListener(
    "keydown",
    function(e) {

        if (
            e.key === "Enter" &&
            !e.shiftKey
        ) {

            e.preventDefault();

            handleSendAction();

        }

    }
);


/* ==========================
   INPUT CHANGE
========================== */

messageInput.addEventListener(
    "input",
    function() {

        updateSendButton();

        socket.emit(
            "typing",
            {
                sender: user.username,
                receiver: receiver
            }
        );


        clearTimeout(
            window.typingTimeout
        );


        window.typingTimeout =
            setTimeout(() => {

                socket.emit(
                    "stopTyping",
                    {
                        sender: user.username,
                        receiver: receiver
                    }
                );

            }, 1000);

    }
);


/* ==========================
   IMAGE CHANGE
========================== */

imageInput.addEventListener(
    "change",
    function() {

        const file =
            imageInput.files[0];

        if (!file) return;


        const reader =
            new FileReader();


        reader.onload =
            function(e) {

                const img =
                    document.getElementById(
                        "previewImage"
                    );

                const box =
                    document.getElementById(
                        "previewBox"
                    );


                if (img) {

                    img.src =
                        e.target.result;

                }


                if (box) {

                    box.style.display =
                        "block";

                }


                updateSendButton();

            };


        reader.readAsDataURL(file);

    }
);


/* ==========================
   REMOVE IMAGE
========================== */

function removeImage() {

    imageInput.value = "";

    const box =
        document.getElementById(
            "previewBox"
        );

    if (box) {

        box.style.display =
            "none";

    }

    updateSendButton();

}


/* ==========================================================
   VOICE RECORDING
========================================================== */

async function startRecording() {

    if (recording) return;


    try {

        const stream =
            await navigator.mediaDevices
                .getUserMedia({
                    audio: true
                });


        mediaRecorder =
            new MediaRecorder(stream);


        audioChunks = [];

        audioBlob = null;


        mediaRecorder.ondataavailable =
            function(event) {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    audioChunks.push(
                        event.data
                    );

                }

            };


        mediaRecorder.onstop =
            function() {

                audioBlob =
                    new Blob(
                        audioChunks,
                        {
                            type:
                                mediaRecorder.mimeType ||
                                "audio/webm"
                        }
                    );


                audioUrl =
                    URL.createObjectURL(
                        audioBlob
                    );


                voicePreview.src =
                    audioUrl;


                voicePreview.load();


                /*
                   Recording ya kare
                   ya zama Preview
                */

                recording = false;


                if (recordDot) {

                    recordDot.style.display =
                        "none";

                }


                if (recordText) {

                    recordText.innerText =
                        "Voice message";

                }


                if (voicePreviewBox) {

                    voicePreviewBox.style.display =
                        "flex";

                }


                /*
                   STOP → SEND
                */

                if (voiceActionIcon) {

                    voiceActionIcon.className =
                        "fa-solid fa-paper-plane";

                }


                /*
                   Enable send
                */

                if (voiceActionBtn) {

                    voiceActionBtn.disabled =
                        false;

                }


                stopTimer();


                /*
                   Microphone permission
                   stream ya tsaya
                */

                stream
                    .getTracks()
                    .forEach(track =>
                        track.stop()
                    );

            };


        mediaRecorder.start();


        recording = true;

        recordSeconds = 0;


        if (recordingBox) {

            recordingBox.style.display =
                "flex";

        }


        if (voicePreviewBox) {

            voicePreviewBox.style.display =
                "none";

        }


        if (recordDot) {

            recordDot.style.display =
                "inline-block";

        }


        if (recordText) {

            recordText.innerText =
                "Recording...";

        }


        if (voiceActionIcon) {

            voiceActionIcon.className =
                "fa-solid fa-stop";

        }


        updateRecordTime();

        startTimer();


    } catch (err) {

        console.error(
            "Microphone Error:",
            err
        );

        alert(
            "Microphone permission is required."
        );

    }

}


/* ==========================
   RECORD TIMER
========================== */

function startTimer() {

    clearInterval(
        recordTimer
    );


    recordTimer =
        setInterval(() => {

            recordSeconds++;

            updateRecordTime();

        }, 1000);

}


/* ==========================
   UPDATE TIMER
========================== */

function updateRecordTime() {

    if (!recordTime) return;


    const minutes =
        Math.floor(
            recordSeconds / 60
        );

    const seconds =
        recordSeconds % 60;


    recordTime.innerText =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");

}


/* ==========================
   STOP TIMER
========================== */

function stopTimer() {

    clearInterval(
        recordTimer
    );

    recordTimer = null;

}


/* ==========================================================
   VOICE ACTION
========================================================== */

function handleVoiceAction() {

    /*
       Recording
       → STOP
    */

    if (recording) {

        stopRecording();

        return;

    }


    /*
       Preview
       → SEND
    */

    if (audioBlob) {

        sendVoice();

    }

}


/* ==========================
   STOP RECORDING
========================== */

function stopRecording() {

    if (
        !mediaRecorder ||
        mediaRecorder.state !== "recording"
    ) {

        return;

    }


    mediaRecorder.stop();

    stopTimer();

}


/* ==========================================================
   CANCEL RECORDING
========================================================== */

function cancelRecording() {

    /*
       Idan recording yana gudana
       → dakatar
    */

    if (
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ) {

        mediaRecorder.stop();

    }


    recording = false;

    stopTimer();


    audioChunks = [];

    audioBlob = null;


    if (audioUrl) {

        URL.revokeObjectURL(
            audioUrl
        );

        audioUrl = null;

    }


    if (voicePreview) {

        voicePreview.pause();

        voicePreview.removeAttribute(
            "src"
        );

        voicePreview.load();

    }


    if (recordingBox) {

        recordingBox.style.display =
            "none";

    }


    if (voicePreviewBox) {

        voicePreviewBox.style.display =
            "none";

    }


    if (recordTime) {

        recordTime.innerText =
            "00:00";

    }


    if (recordText) {

        recordText.innerText =
            "Recording...";

    }


    if (recordDot) {

        recordDot.style.display =
            "inline-block";

    }


    if (voiceActionIcon) {

        voiceActionIcon.className =
            "fa-solid fa-stop";

    }

}


/* ==========================================================
   VOICE PREVIEW PLAY / PAUSE
========================================================== */

function toggleVoicePreview() {

    if (!voicePreview) return;

    if (
        voicePreview.paused
    ) {

        voicePreview.play();

    } else {

        voicePreview.pause();

    }

}


/* ==========================
   VOICE PLAY EVENTS
========================== */

if (voicePreview) {

    voicePreview.addEventListener(
        "play",
        function() {

            if (voicePlayIcon) {

                voicePlayIcon.className =
                    "fa-solid fa-pause";

            }

        }
    );


    voicePreview.addEventListener(
        "pause",
        function() {

            if (voicePlayIcon) {

                voicePlayIcon.className =
                    "fa-solid fa-play";

            }

        }
    );


    voicePreview.addEventListener(
        "ended",
        function() {

            if (voicePlayIcon) {

                voicePlayIcon.className =
                    "fa-solid fa-play";

            }

        }
    );

}


/* ==========================================================
   SEND VOICE
========================================================== */

async function sendVoice() {

    if (!audioBlob) {
        return;
    }


    try {

        const formData =
            new FormData();


        formData.append(
            "sender",
            user.username
        );


        formData.append(
            "receiver",
            receiver
        );


        formData.append(
            "text",
            ""
        );


        // ==========================
        // VOICE FILE
        // ==========================

        const voiceFile =
            new File(
                [audioBlob],
                "voice-message.webm",
                {
                    type:
                        audioBlob.type ||
                        "audio/webm"
                }
            );


        formData.append(
         "voice",
         voiceFile
        );


        // ==========================
        // REPLY
        // ==========================

        if (replyMessage) {

            formData.append(
                "replyTo",
                replyMessage._id || ""
            );

            formData.append(
                "replyUser",
                replyMessage.sender || ""
            );

            formData.append(
                "replyText",
                replyMessage.text || ""
            );

            formData.append(
                "replyImage",
                replyMessage.image || ""
            );

            formData.append(
                "replyVoice",
                replyMessage.voice || ""
            );
        }


        if (voiceActionBtn) {
            voiceActionBtn.disabled = true;
        }


        const res =
            await fetch(
                "/api/messages/voice",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await res.json();


        console.log(
            "VOICE SEND RESPONSE:",
            data
        );


        if (!res.ok || !data.success) {

            alert(
                data.message ||
                "Failed to send voice message"
            );

            return;
        }


        // ==========================
        // ADD MESSAGE
        // ==========================

        appendMessage(
            data.message
        );


        socket.emit(
            "newMessage",
            data.message
        );


        // ==========================
        // RESET
        // ==========================

        resetVoiceComposer();


    } catch (err) {

        console.error(
            "Send Voice Error:",
            err
        );

        alert(
            "Voice message failed to send"
        );


    } finally {

        if (voiceActionBtn) {
            voiceActionBtn.disabled = false;
        }

    }
}


/* ==========================
   RESET VOICE
========================== */

function resetVoiceComposer() {

    recording = false;

    stopTimer();


    audioChunks = [];

    audioBlob = null;


    if (audioUrl) {

        URL.revokeObjectURL(
            audioUrl
        );

        audioUrl = null;

    }


    if (voicePreview) {

        voicePreview.pause();

        voicePreview.removeAttribute(
            "src"
        );

        voicePreview.load();

    }


    if (recordingBox) {

        recordingBox.style.display =
            "none";

    }


    if (voicePreviewBox) {

        voicePreviewBox.style.display =
            "none";

    }


    if (recordTime) {

        recordTime.innerText =
            "00:00";

    }


    if (recordText) {

        recordText.innerText =
            "Recording...";

    }


    if (voiceActionIcon) {

        voiceActionIcon.className =
            "fa-solid fa-stop";

    }


    if (voicePlayIcon) {

        voicePlayIcon.className =
            "fa-solid fa-play";

    }

}


/* ==========================================================
   REPLY
========================================================== */

function startReply(msg) {

    if (!msg) return;

    replyMessage = msg;


    const preview =
        document.getElementById(
            "replyPreview"
        );

    const replyText =
        document.getElementById(
            "replyText"
        );


    if (
        !preview ||
        !replyText
    ) {

        return;

    }


    let text =
        "Message";


    if (msg.text) {

        text =
            msg.text;

    } else if (msg.image) {

        text =
            "📷 Photo";

    } else if (msg.voice) {

        text =
            "🎤 Voice message";

    }


    replyText.innerText =
        text;


    preview.style.display =
        "flex";

}


function cancelReply() {

    replyMessage = null;


    const preview =
        document.getElementById(
            "replyPreview"
        );


    if (preview) {

        preview.style.display =
            "none";

    }

}


/* ==========================================================
   SWIPE REPLY
========================================================== */

function touchStart(e, msg) {

    startX =
        e.touches[0].clientX;


    currentBubble =
        e.target.closest(
            ".bubble-me,.bubble-other"
        );


    swipeMessage =
        msg;


    if (currentBubble) {

        currentBubble.style.transition =
            "";

    }

}


function touchMove(e) {

    if (!currentBubble) return;


    const moveX =
        e.touches[0].clientX;


    let diff =
        moveX - startX;


    diff =
        Math.max(
            0,
            Math.min(
                diff,
                60
            )
        );


    currentBubble.style.transform =
        `translateX(${diff}px)`;

}


function touchEnd() {

    if (!currentBubble) return;


    const style =
        currentBubble.style.transform;


    let moved = 0;


    const match =
        style.match(
            /translateX\(([\d.]+)px\)/
        );


    if (match) {

        moved =
            parseFloat(
                match[1]
            );

    }


    currentBubble.style.transition =
        ".2s";


    currentBubble.style.transform =
        "translateX(0px)";


    if (moved >= 35) {

        navigator.vibrate?.(30);

        startReply(
            swipeMessage
        );

    }


    setTimeout(() => {

        if (currentBubble) {

            currentBubble.style.transition =
                "";

        }

    }, 200);

}

/* ==========================================================
   MESSAGE MENU
========================================================== */

function showMessageMenu(e, msg) {

    e.preventDefault();

    selectedMsg = msg;


    const menu =
        document.getElementById(
            "messageMenu"
        );


    if (!menu) return;


    menu.style.display =
        "block";


    const x =
        e.pageX ||
        (
            e.touches
            ? e.touches[0].pageX
            : 0
        );


    const y =
        e.pageY ||
        (
            e.touches
            ? e.touches[0].pageY
            : 0
        );


    menu.style.left =
        x + "px";


    menu.style.top =
        y + "px";


    const deleteMe =
        document.getElementById(
            "deleteMeOption"
        );


    const deleteAll =
        document.getElementById(
            "deleteAllOption"
        );


    if (
        msg.sender ===
        user.username
    ) {

        if (deleteMe)
            deleteMe.style.display =
                "flex";

        if (deleteAll)
            deleteAll.style.display =
                "flex";

    } else {

        if (deleteMe)
            deleteMe.style.display =
                "none";

        if (deleteAll)
            deleteAll.style.display =
                "none";

    }

}


function replySelected() {

    if (!selectedMsg) return;

    startReply(
        selectedMsg
    );


    const menu =
        document.getElementById(
            "messageMenu"
        );


    if (menu) {

        menu.style.display =
            "none";

    }

}


function reactSelected() {

    if (!selectedMsg) return;


    const menu =
        document.getElementById(
            "messageMenu"
        );


    if (menu) {

        menu.style.display =
            "none";

    }


    selectedMessage =
        selectedMsg._id;


    const popup =
        document.getElementById(
            "reactionPopup"
        );


    if (!popup) return;


    popup.style.display =
        "flex";


    popup.style.left =
        "50%";


    popup.style.top =
        "50%";


    popup.style.transform =
        "translate(-50%,-50%)";

}


function deleteSelected() {

    const menu =
        document.getElementById(
            "messageMenu"
        );


    if (menu) {

        menu.style.display =
            "none";

    }


    if (!selectedMsg) return;


    deleteMessage(
        selectedMsg._id
    );

}


function deleteEveryoneSelected() {

    const menu =
        document.getElementById(
            "messageMenu"
        );


    if (menu) {

        menu.style.display =
            "none";

    }


    if (!selectedMsg) return;


    deleteForEveryone(
        selectedMsg._id
    );

}


/* ==========================================================
   CHAT MENU
========================================================== */

function toggleChatMenu() {

    const menu =
        document.getElementById(
            "chatMenu"
        );


    if (!menu) return;


    menu.style.display =
        menu.style.display === "block"
            ? "none"
            : "block";

}


async function clearChat() {

    if (
        !confirm(
            "Delete all messages?"
        )
    ) return;


    try {

        const res =
            await fetch(
                `/api/messages/clear/${user.username}/${receiver}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await res.json();


        if (data.success) {

            chat.innerHTML = "";

        } else {

            alert(
                data.message
            );

        }

    } catch (err) {

        console.error(err);

    }

}


/* ==========================================================
   DELETE MESSAGE
========================================================== */

async function deleteMessage(
    messageId
) {

    if (
        !confirm(
            "Delete this message for yourself?"
        )
    ) return;


    try {

        const res =
            await fetch(
                `/api/messages/delete/${messageId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            username:
                                user.username
                        })
                }
            );


        const data =
            await res.json();


        if (data.success) {

            loadMessages(false);

        } else {

            alert(
                data.message ||
                "Delete failed"
            );

        }

    } catch (err) {

        console.error(err);

    }

}


/* ==========================================================
   DELETE FOR EVERYONE
========================================================== */

async function deleteForEveryone(
    messageId
) {

    if (
        !confirm(
            "Delete this message for everyone?"
        )
    ) return;


    try {

        const res =
            await fetch(
                `/api/messages/delete-everyone/${messageId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            username:
                                user.username
                        })
                }
            );


        const data =
            await res.json();


        if (data.success) {

            loadMessages(false);


            socket.emit(
                "messageDeleted",
                {
                    messageId
                }
            );

        } else {

            alert(
                data.message ||
                "Delete failed"
            );

        }

    } catch (err) {

        console.error(
            "Delete For Everyone Error:",
            err
        );

    }

}


/* ==========================================================
   REACTIONS
========================================================== */

async function selectReaction(
    emoji
) {

    if (!selectedMessage) return;


    const popup =
        document.getElementById(
            "reactionPopup"
        );


    if (popup) {

        popup.style.display =
            "none";

    }


    try {

        const res =
            await fetch(
                `/api/messages/react/${selectedMessage}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            username:
                                user.username,

                            emoji:
                                emoji
                        })
                }
            );


        const data =
            await res.json();


        if (data.success) {

            loadMessages(false);

        }

    } catch (err) {

        console.error(
            "Reaction Error:",
            err
        );

    }

}


/* ==========================================================
   IMAGE VIEWER
========================================================== */

function openImage(src) {

    const viewer =
        document.getElementById(
            "imageViewer"
        );


    const img =
        document.getElementById(
            "fullImage"
        );


    if (!viewer || !img)
        return;


    img.src =
        src;


    viewer.style.display =
        "flex";

}


function closeImage() {

    const viewer =
        document.getElementById(
            "imageViewer"
        );


    if (viewer) {

        viewer.style.display =
            "none";

    }

}


/* ==========================================================
   SOCKET
========================================================== */

socket.on(
    "connect",
    () => {

        console.log(
            "Socket Connected"
        );


        socket.emit(
            "join",
            user.username
        );

    }
);


socket.on(
    "disconnect",
    () => {

        console.log(
            "Socket Disconnected"
        );

    }
);


socket.on(
    "receiveMessage",
    (msg) => {

        if (

            (
                msg.sender === receiver &&
                msg.receiver === user.username
            )

            ||

            (
                msg.sender === user.username &&
                msg.receiver === receiver
            )

        ) {

            appendMessage(msg);

        }

    }
);


socket.on(
    "messageDelivered",
    () => {

        loadMessages(false);

    }
);


socket.on(
    "messageSeen",
    () => {

        loadMessages(false);

    }
);


socket.on(
    "messageDeleted",
    () => {

        loadMessages(false);

    }
);


/* ==========================================================
   TYPING
========================================================== */

socket.on(
    "typing",
    (data) => {

        if (
            data.sender !== receiver
        ) return;


        const status =
            document.getElementById(
                "status"
            );


        if (status) {

            status.innerHTML =
                '<i class="fa-solid fa-pen"></i> Typing...';

        }

    }
);


socket.on(
    "stopTyping",
    () => {

        const status =
            document.getElementById(
                "status"
            );


        if (status) {

            status.innerHTML =
                '<i class="fa-solid fa-circle online-dot"></i> Online';

        }

    }
);


/* ==========================================================
   ONLINE / OFFLINE
========================================================== */

socket.on(
    "userOnline",
    (username) => {

        if (
            username !== receiver
        ) return;


        const status =
            document.getElementById(
                "status"
            );


        if (status) {

            status.innerHTML =
                '<i class="fa-solid fa-circle online-dot"></i> Online';

        }

    }
);


socket.on(
    "userOffline",
    (username) => {

        if (
            username !== receiver
        ) return;


        const status =
            document.getElementById(
                "status"
            );


        if (status) {

            status.innerHTML =
                '<i class="fa-regular fa-clock"></i> Offline';

        }

    }
);


/* ==========================================================
   CLICK OUTSIDE
========================================================== */

document.addEventListener(
    "click",
    (e) => {

        const messageMenu =
            document.getElementById(
                "messageMenu"
            );


        if (
            messageMenu &&
            !e.target.closest(
                "#messageMenu"
            )
        ) {

            messageMenu.style.display =
                "none";

        }


        const chatMenu =
            document.getElementById(
                "chatMenu"
            );


        if (
            chatMenu &&
            !e.target.closest(
                "#chatMenu"
            ) &&
            !e.target.closest(
                ".header-btn"
            )
        ) {

            chatMenu.style.display =
                "none";

        }


        const popup =
            document.getElementById(
                "reactionPopup"
            );


        if (
            popup &&
            !e.target.closest(
                "#reactionPopup"
            )
        ) {

            popup.style.display =
                "none";

            popup.style.transform =
                "";

        }

    }
);


/* ==========================================================
   ESCAPE
========================================================== */

document.addEventListener(
    "keydown",
    (e) => {

        if (
            e.key !== "Escape"
        ) return;


        const popup =
            document.getElementById(
                "reactionPopup"
            );


        const menu =
            document.getElementById(
                "messageMenu"
            );


        const viewer =
            document.getElementById(
                "imageViewer"
            );


        if (popup) {

            popup.style.display =
                "none";

        }


        if (menu) {

            menu.style.display =
                "none";

        }


        if (viewer) {

            viewer.style.display =
                "none";

        }

    }
);


/* ==========================================================
   IMAGE VIEWER CLICK
========================================================== */

document
    .getElementById("imageViewer")
    ?.addEventListener(
        "click",
        (e) => {

            if (
                e.target.id ===
                "imageViewer"
            ) {

                closeImage();

            }

        }
    );


/* ==========================================================
   AUTO SCROLL
========================================================== */

const observer =
    new MutationObserver(
        () => {

            if (!chat) return;

            chat.scrollTop =
                chat.scrollHeight;

        }
    );


if (chat) {

    observer.observe(
        chat,
        {
            childList: true
        }
    );

}


/* ==========================================================
   NETWORK
========================================================== */

window.addEventListener(
    "offline",
    () => {

        console.log(
            "Offline"
        );

    }
);


window.addEventListener(
    "online",
    () => {

        console.log(
            "Online"
        );

        loadMessages(false);

    }
);


/* ==========================================================
   LOAD
========================================================== */

window.addEventListener(
    "load",
    () => {

        loadChatUser();

        loadMessages();

        updateSendButton();

        messageInput?.focus();

    }
);


/* ==========================================================
   FINISHED
========================================================== */

console.log(
    "2Chat Messenger Loaded Successfully"
);
