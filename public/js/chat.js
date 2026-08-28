/* ==========================================================
   2CHAT MESSENGER
   OPTIMIZED CHAT.JS
========================================================== */

const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    location.href = "/login.html";
    throw new Error("User not logged in");
}

const socket = io();

const params = new URLSearchParams(location.search);
const receiver = params.get("user");

if (!receiver) {
    console.error("Receiver not found");
}


/* ==========================================================
   GLOBAL STATE
========================================================== */

let selectedMessage = null;
let selectedMsg = null;

let replyMessage = null;

let currentBubble = null;
let swipeMessage = null;
let startX = 0;

let mediaRecorder = null;
let mediaStream = null;

let audioChunks = [];
let audioBlob = null;
let audioUrl = null;

let recording = false;
let recordSeconds = 0;
let recordTimer = null;

let loadingMessages = false;
let chatLoaded = false;


/* ==========================================================
   DOM
========================================================== */

const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const imageInput = document.getElementById("image");

const sendBtn = document.getElementById("sendBtn");
const sendIcon = document.getElementById("sendIcon");

const recordingBox = document.getElementById("recordingBox");
const recordTime = document.getElementById("recordTime");
const recordText = document.getElementById("recordText");
const recordDot = document.getElementById("recordDot");

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


/* ==========================================================
   HELPERS
========================================================== */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function isNearBottom() {

    if (!chat) return true;

    return (
        chat.scrollHeight -
        chat.scrollTop -
        chat.clientHeight
    ) < 120;
}


function scrollToBottom(smooth = false) {

    if (!chat) return;

    requestAnimationFrame(() => {

        chat.scrollTo({
            top: chat.scrollHeight,
            behavior: smooth ? "smooth" : "auto"
        });

    });
}


function messageExists(messageId) {

    if (!messageId || !chat) {
        return false;
    }

    return !!chat.querySelector(
        `[data-message-id="${CSS.escape(String(messageId))}"]`
    );
}


/* ==========================================================
   RENDER MESSAGE
========================================================== */

function renderMessage(msg) {

    const mine =
        msg.sender === user.username;

    const messageId =
        escapeHTML(msg._id || "");

    const text =
        escapeHTML(msg.text || "");

    const replyText =
        escapeHTML(msg.replyText || "Message");

    const replyUser =
        escapeHTML(msg.replyUser || "");

    const image =
        escapeHTML(msg.image || "");

    const voice =
        escapeHTML(msg.voice || "");

    let time = "";

    if (msg.createdAt) {

        time =
            new Date(msg.createdAt)
                .toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                });

    }


    let content = "";


    /* IMAGE */

    if (msg.image) {

        content += `
            <div class="message-image">
                <img
                    src="${image}"
                    alt="Image"
                    loading="lazy"
                    onclick="openImage(this.src)"
                >
            </div>
        `;

    }


    /* REPLY */

    if (msg.replyTo) {

        content += `
            <div class="reply-bubble">
                <div class="reply-user">
                    ↩ ${replyUser}
                </div>

                <div class="reply-message">
                    ${replyText}
                </div>
            </div>
        `;

    }


    /* DELETED */

    if (msg.deletedForEveryone) {

        content += `
            <div class="deleted-message">
                <i class="fa-solid fa-ban"></i>
                This message was deleted
            </div>
        `;

    }

    /* VOICE */

    else if (msg.voice) {

        content += `
            <div class="voice-player">

                <button
                    class="voice-play"
                    type="button"
                    onclick="toggleMessageVoice(this)"
                >
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
                    preload="none"
                    src="${voice}"
                ></audio>

            </div>
        `;

    }

    /* TEXT */

    else if (msg.text) {

        content += `
            <div class="message-text">
                ${text}
            </div>
        `;

    }


    /* REACTIONS */

    if (
        Array.isArray(msg.reactions) &&
        msg.reactions.length
    ) {

        content += `
            <div class="message-reactions">
                ${msg.reactions.map(r => `
                    <span class="reaction">
                        ${escapeHTML(r.emoji)}
                    </span>
                `).join("")}
            </div>
        `;

    }


    /* STATUS */

    let status = "";

    if (mine) {

        if (msg.seen) {

            status =
                '<i class="fa-solid fa-check-double seen-status"></i>';

        }

        else if (msg.delivered) {

            status =
                '<i class="fa-solid fa-check-double"></i>';

        }

        else {

            status =
                '<i class="fa-solid fa-check"></i>';

        }

    }


    return `
        <div
            class="${mine ? "me" : "other"}"
            data-message-row="${messageId}"
        >

            <div
                class="${mine ? "bubble-me" : "bubble-other"}"
                data-id="${messageId}"
                data-message-id="${messageId}"
                data-sender="${escapeHTML(msg.sender || "")}"
                data-message='${escapeHTML(JSON.stringify(msg))}'
                oncontextmenu="showMessageMenu(event, this)"
                ontouchstart="touchStart(event, this)"
                ontouchmove="touchMove(event)"
                ontouchend="touchEnd(event)"
            >

                ${content}

                <div class="message-meta">

                    <span class="message-time">
                        ${time}
                    </span>

                    ${
                        mine
                            ? `
                                <small class="message-status">
                                    ${status}
                                </small>
                            `
                            : ""
                    }

                </div>

            </div>

        </div>
    `;
}


/* ==========================================================
   APPEND MESSAGE
========================================================== */

function appendMessage(msg, scroll = true) {

    if (!msg || !chat) {
        return;
    }

    if (
        msg._id &&
        messageExists(msg._id)
    ) {
        return;
    }

    const shouldScroll =
        scroll &&
        (
            isNearBottom() ||
            msg.sender === user.username
        );


    chat.insertAdjacentHTML(
        "beforeend",
        renderMessage(msg)
    );


    if (shouldScroll) {
        scrollToBottom(false);
    }


    markIncomingMessageSeen(msg);
}


/* ==========================================================
   LOAD CHAT USER
========================================================== */

async function loadChatUser() {

    if (!receiver) return;

    try {

        const res =
            await fetch(
                `/api/users/profile/${encodeURIComponent(receiver)}`
            );

        if (!res.ok) return;

        const data =
            await res.json();

        if (!data.success || !data.user) {
            return;
        }

        const chatUser = data.user;

        const name =
            document.getElementById("chatName");

        const avatar =
            document.getElementById("chatAvatar");

        const status =
            document.getElementById("status");


        if (name) {

            name.textContent =
                chatUser.username || receiver;

        }


        if (avatar) {

            avatar.src =
                chatUser.avatar ||
                "/images/default.png";

        }


        if (status) {

            status.innerHTML =
                chatUser.online
                    ? '<i class="fa-solid fa-circle online-dot"></i> Online'
                    : '<i class="fa-regular fa-clock"></i> Offline';

        }

    }

    catch (err) {

        console.error(
            "Load Chat User Error:",
            err
        );

    }

}


/* ==========================================================
   LOAD MESSAGES
   FULL LOAD ONLY WHEN CHAT OPENS
========================================================== */

async function loadMessages(
    autoScroll = true
) {

    if (
        !receiver ||
        loadingMessages ||
        !chat
    ) {
        return;
    }

    loadingMessages = true;


    try {

        const res =
            await fetch(
                `/api/messages/chat?sender=${encodeURIComponent(user.username)}&receiver=${encodeURIComponent(receiver)}`
            );

        if (!res.ok) {
            throw new Error(
                `HTTP ${res.status}`
            );
        }


        const data =
            await res.json();


        if (!data.success) {

            chat.innerHTML = "";

            return;

        }


        const messages =
            Array.isArray(data.messages)
                ? data.messages
                : [];


        /*
           Build HTML once.
           Wannan ya fi insertAdjacentHTML
           sau da yawa sauri.
        */

        const html =
            messages
                .map(renderMessage)
                .join("");


        chat.innerHTML = html;


        chatLoaded = true;


        if (autoScroll) {

            scrollToBottom(false);

        }


        /*
           Mark incoming messages as seen.
        */

        messages.forEach(msg => {

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

    }

    catch (err) {

        console.error(
            "Load Messages Error:",
            err
        );

    }

    finally {

        loadingMessages = false;

    }

}


/* ==========================================================
   MARK INCOMING MESSAGE SEEN
========================================================== */

function markIncomingMessageSeen(msg) {

    if (!msg) return;

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

}


/* ==========================================================
   UPDATE MESSAGE STATUS
========================================================== */

function updateMessageStatus(
    messageId,
    type
) {

    if (!messageId || !chat) {
        return;
    }


    const bubble =
        chat.querySelector(
            `[data-message-id="${CSS.escape(String(messageId))}"]`
        );


    if (!bubble) {
        return;
    }


    const status =
        bubble.querySelector(
            ".message-status"
        );


    if (!status) {
        return;
    }


    if (type === "seen") {

        status.innerHTML =
            '<i class="fa-solid fa-check-double seen-status"></i>';

    }

    else if (type === "delivered") {

        status.innerHTML =
            '<i class="fa-solid fa-check-double"></i>';

    }

}


/* ==========================================================
   SEND TEXT / IMAGE
========================================================== */

async function sendMessage() {

    if (!receiver) return;

    const text =
        messageInput.value.trim();

    const image =
        imageInput.files &&
        imageInput.files.length
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


        if (!res.ok || !data.success) {

            alert(
                data.message ||
                "Failed to send message"
            );

            return;

        }


        /*
           Append locally.
           receiveMessage zai duba duplicate.
        */

        appendMessage(
            data.message,
            true
        );


        socket.emit(
            "newMessage",
            data.message
        );


        messageInput.value = "";

        imageInput.value = "";


        replyMessage = null;


        hideElement("replyPreview");
        hideElement("previewBox");


        updateSendButton();

    }

    catch (err) {

        console.error(
            "Send Message Error:",
            err
        );

        alert(
            "Network Error"
        );

    }

    finally {

        sendBtn.disabled = false;

    }

}


/* ==========================================================
   SEND ACTION
========================================================== */

function handleSendAction() {

    const text =
        messageInput.value.trim();

    const image =
        imageInput.files &&
        imageInput.files.length
            ? imageInput.files[0]
            : null;


    if (text || image) {

        sendMessage();

        return;

    }


    startRecording();

}


/* ==========================================================
   UPDATE SEND BUTTON
========================================================== */

function updateSendButton() {

    if (!sendIcon) return;


    const hasText =
        messageInput.value.trim() !== "";

    const hasImage =
        imageInput.files &&
        imageInput.files.length > 0;


    sendIcon.className =
        hasText || hasImage
            ? "fa-solid fa-paper-plane"
            : "fa-solid fa-microphone";

}


/* ==========================================================
   TEXT INPUT
========================================================== */

messageInput?.addEventListener(
    "input",
    function() {

        updateSendButton();


        socket.emit(
            "typing",
            {
                sender: user.username,
                receiver
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
                        receiver
                    }
                );

            }, 900);

    }
);


messageInput?.addEventListener(
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


/* ==========================================================
   IMAGE INPUT
========================================================== */

imageInput?.addEventListener(
    "change",
    function() {

        const file =
            imageInput.files?.[0];

        if (!file) {
            updateSendButton();
            return;
        }


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


/* ==========================================================
   REMOVE IMAGE
========================================================== */

function removeImage() {

    if (imageInput) {
        imageInput.value = "";
    }


    hideElement(
        "previewBox"
    );


    const img =
        document.getElementById(
            "previewImage"
        );

    if (img) {
        img.removeAttribute("src");
    }


    updateSendButton();

}


/* ==========================================================
   VOICE RECORDING
========================================================== */

async function startRecording() {

    if (recording) {
        return;
    }


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        alert(
            "Microphone is not supported on this device."
        );

        return;

    }


    try {

        mediaStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });


        let mimeType = "";

        if (
            MediaRecorder.isTypeSupported(
                "audio/webm;codecs=opus"
            )
        ) {

            mimeType =
                "audio/webm;codecs=opus";

        }

        else if (
            MediaRecorder.isTypeSupported(
                "audio/webm"
            )
        ) {

            mimeType =
                "audio/webm";

        }


        mediaRecorder =
            mimeType
                ? new MediaRecorder(
                    mediaStream,
                    { mimeType }
                )
                : new MediaRecorder(
                    mediaStream
                );


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

                if (!audioChunks.length) {

                    cleanupRecording();

                    return;

                }


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


                if (voicePreview) {

                    voicePreview.src =
                        audioUrl;

                    voicePreview.load();

                }


                recording = false;


                stopTimer();


                if (recordDot) {
                    recordDot.style.display =
                        "none";
                }


                if (recordText) {
                    recordText.textContent =
                        "Voice message";
                }


                if (voicePreviewBox) {
                    voicePreviewBox.style.display =
                        "flex";
                }


                if (voiceActionIcon) {
                    voiceActionIcon.className =
                        "fa-solid fa-paper-plane";
                }


                stopMediaStream();

            };


        mediaRecorder.onerror =
            function(error) {

                console.error(
                    "MediaRecorder Error:",
                    error
                );

                cleanupRecording();

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
            recordText.textContent =
                "Recording...";
        }


        if (voiceActionIcon) {
            voiceActionIcon.className =
                "fa-solid fa-stop";
        }


        updateRecordTime();
        startTimer();

    }

    catch (err) {

        console.error(
            "Microphone Error:",
            err
        );

        stopMediaStream();

        alert(
            "Microphone permission is required."
        );

    }

}


/* ==========================================================
   STOP MEDIA STREAM
========================================================== */

function stopMediaStream() {

    if (!mediaStream) {
        return;
    }


    mediaStream
        .getTracks()
        .forEach(track => {

            try {
                track.stop();
            }
            catch {}

        });


    mediaStream = null;

}


/* ==========================================================
   TIMER
========================================================== */

function startTimer() {

    stopTimer();


    recordTimer =
        setInterval(() => {

            recordSeconds++;

            updateRecordTime();

        }, 1000);

}


function stopTimer() {

    if (recordTimer) {

        clearInterval(
            recordTimer
        );

        recordTimer = null;

    }

}


function updateRecordTime() {

    if (!recordTime) return;


    const minutes =
        Math.floor(
            recordSeconds / 60
        );

    const seconds =
        recordSeconds % 60;


    recordTime.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");

}


/* ==========================================================
   VOICE ACTION
========================================================== */

function handleVoiceAction() {

    if (recording) {

        stopRecording();

        return;

    }


    if (audioBlob) {

        sendVoice();

    }

}


/* ==========================================================
   STOP RECORDING
========================================================== */

function stopRecording() {

    if (
        !mediaRecorder ||
        mediaRecorder.state !== "recording"
    ) {
        return;
    }


    stopTimer();

    mediaRecorder.stop();

}


/* ==========================================================
   CANCEL RECORDING
========================================================== */

function cancelRecording() {

    stopTimer();


    if (
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ) {

        try {
            mediaRecorder.stop();
        }
        catch {}

    }


    stopMediaStream();


    recording = false;

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
        recordTime.textContent =
            "00:00";
    }


    if (recordText) {
        recordText.textContent =
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
   CLEANUP RECORDING
========================================================== */

function cleanupRecording() {

    stopTimer();
    stopMediaStream();

    recording = false;

    audioChunks = [];
    audioBlob = null;

}


/* ==========================================================
   VOICE PREVIEW
========================================================== */

function toggleVoicePreview() {

    if (!voicePreview) {
        return;
    }


    if (voicePreview.paused) {

        voicePreview
            .play()
            .then(() => {

                if (voicePlayIcon) {

                    voicePlayIcon.className =
                        "fa-solid fa-pause";

                }

            })
            .catch(err => {

                console.error(
                    "Voice Preview Error:",
                    err
                );

            });

    }

    else {

        voicePreview.pause();

        if (voicePlayIcon) {

            voicePlayIcon.className =
                "fa-solid fa-play";

        }

    }

}


voicePreview?.addEventListener(
    "ended",
    function() {

        if (voicePlayIcon) {

            voicePlayIcon.className =
                "fa-solid fa-play";

        }

    }
);


voicePreview?.addEventListener(
    "pause",
    function() {

        if (voicePlayIcon) {

            voicePlayIcon.className =
                "fa-solid fa-play";

        }

    }
);


/* ==========================================================
   MESSAGE VOICE
   ONLY ONE VOICE CAN PLAY
========================================================== */

function stopAllMessageVoices(except = null) {

    if (!chat) return;


    chat
        .querySelectorAll(".voice-audio")
        .forEach(player => {

            if (player !== except) {

                player.pause();

                player.currentTime = 0;


                const playerBox =
                    player.closest(
                        ".voice-player"
                    );


                if (!playerBox) {
                    return;
                }


                const icon =
                    playerBox.querySelector(
                        ".voice-play i"
                    );

                const progress =
                    playerBox.querySelector(
                        ".voice-progress"
                    );


                if (icon) {

                    icon.className =
                        "fa-solid fa-play";

                }


                if (progress) {

                    progress.style.width =
                        "0%";

                }

            }

        });

}


function toggleMessageVoice(button) {

    if (!button) return;


    const box =
        button.closest(
            ".voice-player"
        );


    if (!box) return;


    const player =
        box.querySelector(
            ".voice-audio"
        );


    const icon =
        box.querySelector(
            ".voice-play i"
        );


    if (!player) return;


    if (!player.paused) {

        player.pause();

        return;

    }


    stopAllMessageVoices(
        player
    );


    player.volume = 1;


    player
        .play()
        .catch(err => {

            console.error(
                "Voice Play Error:",
                err
            );

        });

}


/* ==========================================================
   VOICE EVENTS
========================================================== */

document.addEventListener(
    "timeupdate",
    function(e) {

        const player =
            e.target.closest?.(
                ".voice-audio"
            );

        if (!player) return;


        const box =
            player.closest(
                ".voice-player"
            );

        if (!box) return;


        const progress =
            box.querySelector(
                ".voice-progress"
            );

        const time =
            box.querySelector(
                ".voice-time"
            );


        if (
            progress &&
            Number.isFinite(player.duration) &&
            player.duration > 0
        ) {

            const percent =
                (
                    player.currentTime /
                    player.duration
                ) * 100;

            progress.style.width =
                percent + "%";

        }


        if (time) {

            const totalSeconds =
                Math.floor(
                    player.currentTime
                );

            const minutes =
                Math.floor(
                    totalSeconds / 60
                );

            const seconds =
                totalSeconds % 60;

            time.textContent =
                minutes +
                ":" +
                String(seconds)
                    .padStart(2, "0");

        }

    },
    true
);


document.addEventListener(
    "play",
    function(e) {

        const player =
            e.target.closest?.(
                ".voice-audio"
            );

        if (!player) return;


        const box =
            player.closest(
                ".voice-player"
            );


        const icon =
            box?.querySelector(
                ".voice-play i"
            );


        if (icon) {

            icon.className =
                "fa-solid fa-pause";

        }

    },
    true
);


document.addEventListener(
    "pause",
    function(e) {

        const player =
            e.target.closest?.(
                ".voice-audio"
            );

        if (!player) return;


        const box =
            player.closest(
                ".voice-player"
            );


        const icon =
            box?.querySelector(
                ".voice-play i"
            );


        if (icon) {

            icon.className =
                "fa-solid fa-play";

        }

    },
    true
);


document.addEventListener(
    "ended",
    function(e) {

        const player =
            e.target.closest?.(
                ".voice-audio"
            );

        if (!player) return;


        const box =
            player.closest(
                ".voice-player"
            );


        const icon =
            box?.querySelector(
                ".voice-play i"
            );

        const progress =
            box?.querySelector(
                ".voice-progress"
            );


        if (icon) {

            icon.className =
                "fa-solid fa-play";

        }


        if (progress) {

            progress.style.width =
                "0%";

        }

    },
    true
);


/* ==========================================================
   SEND VOICE
========================================================== */

async function sendVoice() {

    if (
        !audioBlob ||
        !receiver
    ) {
        return;
    }


    try {

        if (voiceActionBtn) {
            voiceActionBtn.disabled = true;
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
            ""
        );


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


        if (!res.ok || !data.success) {

            alert(
                data.message ||
                "Failed to send voice message"
            );

            return;

        }


        appendMessage(
            data.message,
            true
        );


        socket.emit(
            "newMessage",
            data.message
        );


        replyMessage = null;

        hideElement(
            "replyPreview"
        );


        resetVoiceComposer();

    }

    catch (err) {

        console.error(
            "Send Voice Error:",
            err
        );

        alert(
            "Voice message failed to send"
        );

    }

    finally {

        if (voiceActionBtn) {
            voiceActionBtn.disabled = false;
        }

    }

}


/* ==========================================================
   RESET VOICE
========================================================== */

function resetVoiceComposer() {

    stopTimer();
    stopMediaStream();


    recording = false;

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

        recordTime.textContent =
            "00:00";

    }


    if (recordText) {

        recordText.textContent =
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


    if (!preview || !replyText) {
        return;
    }


    let text = "Message";


    if (msg.text) {

        text =
            msg.text;

    }

    else if (msg.image) {

        text =
            "📷 Photo";

    }

    else if (msg.voice) {

        text =
            "🎤 Voice message";

    }


    replyText.textContent =
        text;


    preview.style.display =
        "flex";


    messageInput?.focus();

}


function cancelReply() {

    replyMessage = null;

    hideElement(
        "replyPreview"
    );

}


/* ==========================================================
   SWIPE REPLY
========================================================== */

function touchStart(e, bubble) {

    if (!e.touches?.length) {
        return;
    }


    startX =
        e.touches[0].clientX;


    currentBubble =
        bubble;


    const raw =
        bubble?.dataset.message;


    if (raw) {

        try {

            swipeMessage =
                JSON.parse(
                    raw
                );

        }

        catch {

            swipeMessage =
                null;

        }

    }


    if (currentBubble) {

        currentBubble.style.transition =
            "none";

    }

}


function touchMove(e) {

    if (
        !currentBubble ||
        !e.touches?.length
    ) {
        return;
    }


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
        `translate3d(${diff}px,0,0)`;

}


function touchEnd() {

    if (!currentBubble) {
        return;
    }


    const transform =
        currentBubble.style.transform;


    const match =
        transform.match(
            /translate3d\(([\d.]+)px/
        );


    const moved =
        match
            ? parseFloat(match[1])
            : 0;


    currentBubble.style.transition =
        "transform .18s ease";

    currentBubble.style.transform =
        "translate3d(0,0,0)";


    if (
        moved >= 35 &&
        swipeMessage
    ) {

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

    }, 180);


    currentBubble = null;
    swipeMessage = null;

}


/* ==========================================================
   MESSAGE MENU
========================================================== */

function showMessageMenu(e, bubble) {

    e.preventDefault();


    selectedMsg = null;


    if (bubble?.dataset.message) {

        try {

            selectedMsg =
                JSON.parse(
                    bubble.dataset.message
                );

        }

        catch {}

    }


    if (!selectedMsg) {
        return;
    }


    const menu =
        document.getElementById(
            "messageMenu"
        );


    if (!menu) return;


    menu.style.display =
        "block";


    const x =
        e.pageX ||
        e.clientX ||
        0;

    const y =
        e.pageY ||
        e.clientY ||
        0;


    const menuWidth =
        menu.offsetWidth || 210;

    const menuHeight =
        menu.offsetHeight || 200;


    const left =
        Math.min(
            x,
            window.innerWidth -
            menuWidth -
            10
        );


    const top =
        Math.min(
            y,
            window.innerHeight -
            menuHeight -
            10
        );


    menu.style.left =
        Math.max(10, left) + "px";

    menu.style.top =
        Math.max(10, top) + "px";


    const deleteMe =
        document.getElementById(
            "deleteMeOption"
        );

    const deleteAll =
        document.getElementById(
            "deleteAllOption"
        );


    const mine =
        selectedMsg.sender ===
        user.username;


    if (deleteMe) {

        deleteMe.style.display =
            mine ? "flex" : "none";

    }


    if (deleteAll) {

        deleteAll.style.display =
            mine ? "flex" : "none";

    }

}


function replySelected() {

    if (!selectedMsg) return;

    startReply(
        selectedMsg
    );

    hideElement(
        "messageMenu"
    );

}


function reactSelected() {

    if (!selectedMsg) return;


    hideElement(
        "messageMenu"
    );


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

    hideElement(
        "messageMenu"
    );


    if (!selectedMsg) return;


    deleteMessage(
        selectedMsg._id
    );

}


function deleteEveryoneSelected() {

    hideElement(
        "messageMenu"
    );


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
    ) {
        return;
    }


    try {

        const res =
            await fetch(
                `/api/messages/clear/${encodeURIComponent(user.username)}/${encodeURIComponent(receiver)}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await res.json();


        if (data.success) {

            chat.innerHTML = "";

        }

        else {

            alert(
                data.message ||
                "Failed to clear chat"
            );

        }

    }

    catch (err) {

        console.error(
            "Clear Chat Error:",
            err
        );

    }

}


/* ==========================================================
   DELETE FOR ME
========================================================== */

async function deleteMessage(
    messageId
) {

    if (
        !confirm(
            "Delete this message for yourself?"
        )
    ) {
        return;
    }


    try {

        const res =
            await fetch(
                `/api/messages/delete/${encodeURIComponent(messageId)}`,
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


        if (!res.ok || !data.success) {

            alert(
                data.message ||
                "Delete failed"
            );

            return;

        }


        removeMessageFromDOM(
            messageId
        );

    }

    catch (err) {

        console.error(
            "Delete Error:",
            err
        );

    }

}


/* ==========================================================
   DELETE EVERYONE
========================================================== */

async function deleteForEveryone(
    messageId
) {

    if (
        !confirm(
            "Delete this message for everyone?"
        )
    ) {
        return;
    }


    try {

        const res =
            await fetch(
                `/api/messages/delete-everyone/${encodeURIComponent(messageId)}`,
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


        if (!res.ok || !data.success) {

            alert(
                data.message ||
                "Delete failed"
            );

            return;

        }


        updateDeletedMessage(
            messageId
        );


        socket.emit(
            "messageDeleted",
            {
                messageId
            }
        );

    }

    catch (err) {

        console.error(
            "Delete Everyone Error:",
            err
        );

    }

}


/* ==========================================================
   REMOVE MESSAGE DOM
========================================================== */

function removeMessageFromDOM(
    messageId
) {

    if (!chat) return;


    const bubble =
        chat.querySelector(
            `[data-message-id="${CSS.escape(String(messageId))}"]`
        );


    const row =
        bubble?.closest(
            "[data-message-row]"
        );


    if (row) {

        row.remove();

    }

}


/* ==========================================================
   UPDATE DELETED MESSAGE
========================================================== */

function updateDeletedMessage(
    messageId
) {

    if (!chat) return;


    const bubble =
        chat.querySelector(
            `[data-message-id="${CSS.escape(String(messageId))}"]`
        );


    if (!bubble) return;


    const voice =
        bubble.querySelector(
            ".voice-player"
        );

    const image =
        bubble.querySelector(
            ".message-image"
        );

    const text =
        bubble.querySelector(
            ".message-text"
        );


    if (voice) {
        voice.remove();
    }

    if (image) {
        image.remove();
    }

    if (text) {
        text.remove();
    }


    const deleted =
        bubble.querySelector(
            ".deleted-message"
        );


    if (!deleted) {

        bubble.insertAdjacentHTML(
            "afterbegin",
            `
            <div class="deleted-message">
                <i class="fa-solid fa-ban"></i>
                This message was deleted
            </div>
            `
        );

    }

}


/* ==========================================================
   REACTION
========================================================== */

async function selectReaction(
    emoji
) {

    if (!selectedMessage) {
        return;
    }


    hideElement(
        "reactionPopup"
    );


    try {

        const res =
            await fetch(
                `/api/messages/react/${encodeURIComponent(selectedMessage)}`,
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

                            emoji
                        })
                }
            );


        const data =
            await res.json();


        if (!res.ok || !data.success) {

            alert(
                data.message ||
                "Reaction failed"
            );

            return;

        }


        /*
           Update only this message.
        */

        updateMessageReaction(
            selectedMessage,
            data.message ||
            data.updatedMessage ||
            data.data
        );

    }

    catch (err) {

        console.error(
            "Reaction Error:",
            err
        );

    }

}


/* ==========================================================
   UPDATE REACTION
========================================================== */

function updateMessageReaction(
    messageId,
    updatedMessage
) {

    if (
        !updatedMessage ||
        !chat
    ) {
        /*
           API ba dawo da message ba.
           A wannan yanayin ba za mu
           reload duk chat ba.
        */
        return;
    }


    const bubble =
        chat.querySelector(
            `[data-message-id="${CSS.escape(String(messageId))}"]`
        );


    if (!bubble) return;


    const old =
        bubble.querySelector(
            ".message-reactions"
        );


    const reactions =
        Array.isArray(
            updatedMessage.reactions
        )
            ? updatedMessage.reactions
            : [];


    const html =
        reactions.length
            ? `
                <div class="message-reactions">
                    ${reactions.map(r => `
                        <span class="reaction">
                            ${escapeHTML(r.emoji)}
                        </span>
                    `).join("")}
                </div>
            `
            : "";


    if (old) {

        old.outerHTML =
            html;

    }

    else if (html) {

        bubble.insertAdjacentHTML(
            "beforeend",
            html
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


    if (!viewer || !img) {
        return;
    }


    img.src =
        src;


    viewer.style.display =
        "flex";

}


function closeImage() {

    hideElement(
        "imageViewer"
    );

}


/* ==========================================================
   SOCKET CONNECT
========================================================== */

socket.on(
    "connect",
    function() {

        console.log(
            "2Chat Socket Connected"
        );


        socket.emit(
            "join",
            user.username
        );

    }
);


socket.on(
    "disconnect",
    function() {

        console.log(
            "2Chat Socket Disconnected"
        );

    }
);


/* ==========================================================
   RECEIVE MESSAGE
========================================================== */

socket.on(
    "receiveMessage",
    function(msg) {

        if (!msg) return;


        const isThisChat =
            (
                msg.sender === receiver &&
                msg.receiver === user.username
            )
            ||
            (
                msg.sender === user.username &&
                msg.receiver === receiver
            );


        if (!isThisChat) {
            return;
        }


        /*
           Duplicate protection.
        */

        if (
            msg._id &&
            messageExists(msg._id)
        ) {
            return;
        }


        appendMessage(
            msg,
            true
        );

    }
);


/* ==========================================================
   DELIVERED
========================================================== */

socket.on(
    "messageDelivered",
    function(data) {

        if (!data) return;


        const messageId =
            data.messageId ||
            data._id ||
            data.id;


        if (messageId) {

            updateMessageStatus(
                messageId,
                "delivered"
            );

        }

    }
);


/* ==========================================================
   SEEN
========================================================== */

socket.on(
    "messageSeen",
    function(data) {

        if (!data) return;


        const messageId =
            data.messageId ||
            data._id ||
            data.id;


        if (messageId) {

            updateMessageStatus(
                messageId,
                "seen"
            );

        }

    }
);


/* ==========================================================
   MESSAGE DELETED
========================================================== */

socket.on(
    "messageDeleted",
    function(data) {

        if (!data) return;


        const messageId =
            data.messageId ||
            data._id ||
            data.id;


        if (!messageId) {
            return;
        }


        updateDeletedMessage(
            messageId
        );

    }
);


/* ==========================================================
   TYPING
========================================================== */

socket.on(
    "typing",
    function(data) {

        if (
            !data ||
            data.sender !== receiver
        ) {
            return;
        }


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
    function(data) {

        if (
            data &&
            data.sender &&
            data.sender !== receiver
        ) {
            return;
        }


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
   ONLINE
========================================================== */

socket.on(
    "userOnline",
    function(username) {

        if (
            username !== receiver
        ) {
            return;
        }


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
   OFFLINE
========================================================== */

socket.on(
    "userOffline",
    function(username) {

        if (
            username !== receiver
        ) {
            return;
        }


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
    function(e) {

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
    function(e) {

        if (
            e.key !== "Escape"
        ) {
            return;
        }


        hideElement("messageMenu");
        hideElement("chatMenu");
        hideElement("reactionPopup");
        hideElement("imageViewer");

    }
);


/* ==========================================================
   IMAGE VIEWER CLICK
========================================================== */

document
    .getElementById("imageViewer")
    ?.addEventListener(
        "click",
        function(e) {

            if (
                e.target.id ===
                "imageViewer"
            ) {

                closeImage();

            }

        }
    );


/* ==========================================================
   ONLINE / OFFLINE
========================================================== */

window.addEventListener(
    "online",
    function() {

        console.log(
            "2Chat Online"
        );

        if (chatLoaded) {
            loadMessages(false);
        }

    }
);


window.addEventListener(
    "offline",
    function() {

        console.log(
            "2Chat Offline"
        );

    }
);


/* ==========================================================
   UTILITY
========================================================== */

function hideElement(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.style.display =
            "none";

    }

}


/* ==========================================================
   INITIAL LOAD
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadChatUser();

        loadMessages(true);

        updateSendButton();

    }
);


/* ==========================================================
   FINISHED
========================================================== */

console.log(
    "2Chat Optimized Messenger Loaded Successfully"
);
                   
