(() => {
    "use strict";

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    if (!user || !token || typeof io !== "function") return;

    const socket = window.twoChatCallSocket = io({
        auth: { token }
    });

    let activeCallId = null;
    let peerConnection = null;
    let localStream = null;
    let ringtoneContext = null;
    let ringInterval = null;
    let callState = "idle";
    let pendingIceCandidates = [];

    const style = document.createElement("style");
    style.textContent = `
      #twochat-call-layer{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(5,12,25,.82);font-family:Arial,sans-serif}
      #twochat-call-card{width:min(90%,360px);padding:28px 22px;border-radius:22px;background:#142238;color:#fff;text-align:center;box-shadow:0 15px 50px #0008}
      #twochat-call-title{font-size:22px;margin:0 0 8px}
      #twochat-call-status{color:#cbd5e1;margin:0 0 24px}
      .twochat-call-actions{display:flex;justify-content:center;gap:18px}
      .twochat-call-actions button{border:0;border-radius:50%;width:58px;height:58px;color:#fff;font-size:21px;background:#16a34a}
      .twochat-call-actions button.end{background:#dc2626}
      #twochat-call-audio{display:none}
      #twochat-call-button{border:0;background:transparent;color:inherit;font-size:20px;padding:8px;cursor:pointer}
    `;
    document.head.appendChild(style);

    const layer = document.createElement("div");
    layer.id = "twochat-call-layer";
    layer.innerHTML = `
      <section id="twochat-call-card" role="dialog" aria-modal="true">
        <h2 id="twochat-call-title">Voice Call</h2>
        <p id="twochat-call-status">Connecting...</p>
        <div class="twochat-call-actions" id="twochat-call-actions"></div>
        <audio id="twochat-call-audio" autoplay></audio>
      </section>`;
    document.body.appendChild(layer);

    const title = layer.querySelector("#twochat-call-title");
    const status = layer.querySelector("#twochat-call-status");
    const actions = layer.querySelector("#twochat-call-actions");
    const remoteAudio = layer.querySelector("#twochat-call-audio");

    function show(name, message, buttons) {
        title.textContent = name || "Voice Call";
        status.textContent = message || "";
        actions.innerHTML = "";
        buttons.forEach(item => {
            const button = document.createElement("button");
            button.className = item.end ? "end" : "";
            button.type = "button";
            button.textContent = item.text;
            button.setAttribute("aria-label", item.label);
            button.addEventListener("click", item.action);
            actions.appendChild(button);
        });
        layer.style.display = "flex";
    }

    function hide() {
        layer.style.display = "none";
        actions.innerHTML = "";
    }

    function stopRingtone() {
        if (ringInterval) clearInterval(ringInterval);
        ringInterval = null;
        if (ringtoneContext) {
            ringtoneContext.close().catch(() => {});
            ringtoneContext = null;
        }
    }

    function ring() {
        stopRingtone();
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        try {
            ringtoneContext = new AudioContext();
            const beep = () => {
                if (!ringtoneContext) return;
                const oscillator = ringtoneContext.createOscillator();
                const gain = ringtoneContext.createGain();
                oscillator.frequency.value = 740;
                gain.gain.value = 0.08;
                oscillator.connect(gain);
                gain.connect(ringtoneContext.destination);
                oscillator.start();
                oscillator.stop(ringtoneContext.currentTime + 0.35);
            };
            beep();
            ringInterval = setInterval(beep, 1100);
        } catch (_) {}
    }

    async function ensurePeer() {
        if (peerConnection) return peerConnection;
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        peerConnection.ontrack = event => {
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.play().catch(() => {});
        };
        peerConnection.onicecandidate = event => {
            if (event.candidate && activeCallId) {
                socket.emit("call:signal", {
                    callId: activeCallId,
                    kind: "ice-candidate",
                    signal: event.candidate
                });
            }
        };
        peerConnection.onconnectionstatechange = () => {
            if (peerConnection && peerConnection.connectionState === "connected") {
                status.textContent = "Call connected";
            }
        };
        return peerConnection;
    }

    async function cleanup(sendEnd) {
        stopRingtone();
        if (sendEnd && activeCallId) socket.emit("call:end", { callId: activeCallId });
        if (peerConnection) peerConnection.close();
        peerConnection = null;
        pendingIceCandidates = [];
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        localStream = null;
        remoteAudio.srcObject = null;
        activeCallId = null;
        callState = "idle";
        hide();
    }

    function endButton() {
        return [{ text: "✕", label: "End call", end: true, action: () => cleanup(true) }];
    }

    window.start2ChatVoiceCall = receiver => {
        if (!receiver || callState !== "idle" || !socket.connected) {
            alert("Call service is not connected. Please try again.");
            return;
        }
        callState = "outgoing";
        show(receiver, "Calling...", [{ text: "✕", label: "Cancel call", end: true, action: () => {
            if (activeCallId) socket.emit("call:cancel", { callId: activeCallId });
            cleanup(false);
        }}]);
        socket.emit("call:start", { receiver });
    };

    socket.on("connect", () => {
        socket.emit("join");
        socket.emit("call:presence", document.visibilityState === "visible" && document.hasFocus());
    });

    const updatePresence = () => {
        socket.emit("call:presence", document.visibilityState === "visible" && document.hasFocus());
    };
    document.addEventListener("visibilitychange", updatePresence);
    window.addEventListener("focus", updatePresence);
    window.addEventListener("blur", updatePresence);

    socket.on("call:outgoing", data => {
        activeCallId = data.callId;
        if (callState !== "outgoing") {
            socket.emit("call:cancel", { callId: data.callId });
        }
    });

    socket.on("call:incoming", data => {
        if (callState !== "idle" || document.visibilityState !== "visible" || !document.hasFocus()) {
            socket.emit("call:decline", { callId: data.callId });
            return;
        }
        activeCallId = data.callId;
        callState = "incoming";
        ring();
        show(data.caller, "Incoming voice call", [
            { text: "✓", label: "Accept call", action: async () => {
                stopRingtone();
                try {
                    await ensurePeer();
                    callState = "connected";
                    socket.emit("call:accept", { callId: activeCallId });
                    status.textContent = "Connecting audio...";
                } catch (error) {
                    socket.emit("call:decline", { callId: activeCallId });
                    await cleanup(false);
                    alert("Microphone permission is required to answer a voice call.");
                }
            }},
            { text: "✕", label: "Decline call", end: true, action: async () => {
                socket.emit("call:decline", { callId: activeCallId });
                await cleanup(false);
            }}
        ]);
    });

    socket.on("call:accepted", async data => {
        if (data.callId !== activeCallId) return;
        stopRingtone();
        try {
            const pc = await ensurePeer();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("call:signal", { callId: activeCallId, kind: "offer", signal: offer });
            callState = "connected";
            status.textContent = "Connecting audio...";
        } catch (error) {
            alert("Unable to access microphone. Check app permissions.");
            cleanup(true);
        }
    });

    socket.on("call:signal", async data => {
        if (data.callId !== activeCallId) return;
        try {
            const pc = await ensurePeer();
            if (data.kind === "offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("call:signal", { callId: activeCallId, kind: "answer", signal: answer });
            } else if (data.kind === "answer") {
                await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
            } else if (data.kind === "ice-candidate") {
                const candidate = new RTCIceCandidate(data.signal);
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    await pc.addIceCandidate(candidate);
                } else {
                    pendingIceCandidates.push(candidate);
                }
            }

            if (pc.remoteDescription && pc.remoteDescription.type && pendingIceCandidates.length) {
                const queued = pendingIceCandidates.splice(0);
                for (const candidate of queued) {
                    await pc.addIceCandidate(candidate);
                }
            }
        } catch (error) {
            console.error("2Chat call signaling error:", error);
        }
    });

    ["call:declined", "call:cancelled", "call:no-answer", "call:unavailable", "call:ended"].forEach(eventName => {
        socket.on(eventName, async data => {
            if (data && data.callId && activeCallId && data.callId !== activeCallId) return;
            const message = eventName === "call:declined" ? "Call declined" :
                eventName === "call:no-answer" ? "No answer" :
                eventName === "call:unavailable" ? "User is not active in 2Chat" :
                eventName === "call:cancelled" ? "Call cancelled" : "Call ended";
            status.textContent = message;
            setTimeout(() => cleanup(false), 900);
        });
    });

    socket.on("call:missed", data => {
        if (document.visibilityState === "visible") {
            console.info("Missed call from", data.caller);
        }
    });

    socket.on("call:error", data => {
        status.textContent = data.message || "Call error";
        setTimeout(() => cleanup(false), 1500);
    });

    // Add the call control only on a one-to-one chat page.
    const receiver = new URLSearchParams(location.search).get("user");
    const headerActions = document.querySelector(".chat-header .header-actions");
    if (receiver && headerActions) {
        const button = document.createElement("button");
        button.id = "twochat-call-button";
        button.type = "button";
        button.title = "Voice call";
        button.setAttribute("aria-label", "Start voice call");
        button.innerHTML = '<i class="fa-solid fa-phone"></i>';
        button.addEventListener("click", () => window.start2ChatVoiceCall(receiver));
        headerActions.prepend(button);
    }
})();