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
    let callTimerInterval = null;
    let callStartedAt = null;
    let isMuted = false;
    let speakerEnabled = true;
    let configuredIceServers = [{ urls: "stun:stun.l.google.com:19302" }];
    let iceConfigPromise = null;

    const style = document.createElement("style");
    style.textContent = `
      #twochat-call-layer{position:fixed;top:0;right:0;bottom:0;left:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(5,12,25,.82);font-family:Arial,sans-serif}
      #twochat-call-card{width:90%;max-width:360px;padding:28px 22px;border-radius:22px;background:#142238;color:#fff;text-align:center;box-shadow:0 15px 50px #0008}
      #twochat-call-title{font-size:22px;margin:0 0 8px}
      #twochat-call-status{color:#cbd5e1;margin:0 0 24px}
      .twochat-call-actions{display:flex;justify-content:center}
      .twochat-call-actions button{margin:0 9px;border:0;border-radius:50%;width:58px;height:58px;color:#fff;font-size:21px;background:#16a34a}
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
    const timerDisplay = layer.querySelector("#twochat-call-timer");
    const avatar = layer.querySelector("#twochat-call-avatar");
    const actions = layer.querySelector("#twochat-call-actions");
    const remoteAudio = layer.querySelector("#twochat-call-audio");

    function formatCallDuration(seconds) {
        const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
        const remainder = String(seconds % 60).padStart(2, "0");
        return minutes + ":" + remainder;
    }

    function stopCallTimer() {
        if (callTimerInterval) clearInterval(callTimerInterval);
        callTimerInterval = null;
        callStartedAt = null;
        if (timerDisplay) timerDisplay.textContent = "";
    }

    function startCallTimer() {
        if (callTimerInterval) return;
        callStartedAt = Date.now();
        const update = () => {
            if (callStartedAt && timerDisplay) timerDisplay.textContent = formatCallDuration(Math.floor((Date.now() - callStartedAt) / 1000));
        };
        update();
        callTimerInterval = setInterval(update, 1000);
    }

    function activeCallButtons() {
        return [
            { text: isMuted ? "🎙" : "🎤", label: isMuted ? "Unmute microphone" : "Mute microphone", action: toggleMute },
            { text: speakerEnabled ? "🔊" : "🔉", label: speakerEnabled ? "Lower call volume" : "Restore call volume", action: toggleSpeaker },
            { text: "✕", label: "End call", end: true, action: () => cleanup(true) }
        ];
    }

    function toggleMute() {
        if (!localStream) return;
        isMuted = !isMuted;
        localStream.getAudioTracks().forEach(track => { track.enabled = !isMuted; });
        show(title.textContent, status.textContent, activeCallButtons());
    }

    function toggleSpeaker() {
        speakerEnabled = !speakerEnabled;
        remoteAudio.volume = speakerEnabled ? 1 : 0.35;
        show(title.textContent, status.textContent, activeCallButtons());
    }

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
        stopCallTimer();
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

    function getMicrophoneStream() {
        var constraints = { audio: true, video: false };

        if (navigator.mediaDevices &&
                typeof navigator.mediaDevices.getUserMedia === "function") {
            return navigator.mediaDevices.getUserMedia(constraints);
        }

        // Older Android System WebView versions expose the legacy callback API.
        var legacyGetUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;

        if (typeof legacyGetUserMedia === "function") {
            return new Promise(function(resolve, reject) {
                legacyGetUserMedia.call(navigator, constraints, resolve, reject);
            });
        }

        return Promise.reject(new Error(
            "This Android WebView does not support microphone capture. Update Android System WebView or Chrome."
        ));
    }

    async function ensurePeer() {
        if (peerConnection) return peerConnection;

        if (iceConfigPromise) await iceConfigPromise;

        localStream = await getMicrophoneStream();

        var PeerConnectionClass = window.RTCPeerConnection ||
            window.webkitRTCPeerConnection;

        if (typeof PeerConnectionClass !== "function") {
            localStream.getTracks().forEach(function(track) {
                track.stop();
            });
            localStream = null;
            throw new Error("This Android WebView does not support WebRTC voice calls.");
        }

        peerConnection = new PeerConnectionClass({
            iceServers: configuredIceServers
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
        stopCallTimer();
        isMuted = false;
        speakerEnabled = true;
        remoteAudio.volume = 1;
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

    function waitForCallSocket(timeoutMs = 10000) {
        if (socket.connected) return Promise.resolve(true);
        return new Promise(resolve => {
            let settled = false;
            const finish = value => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                socket.off("connect", onConnect);
                resolve(value);
            };
            const onConnect = () => finish(true);
            const timer = setTimeout(() => finish(false), timeoutMs);
            socket.once("connect", onConnect);
            // If Socket.IO is disconnected, ask it to reconnect.
            if (!socket.active) socket.connect();
        });
    }

    window.start2ChatVoiceCall = async receiver => {
        if (!receiver || callState !== "idle") return;
        callState = "connecting";
        show(receiver, "Connecting to call service...", [{ text: "✕", label: "Cancel call", end: true, action: () => {
            callState = "idle";
            cleanup(false);
        }}]);

        const connected = await waitForCallSocket();
        if (!connected || !socket.connected) {
            await cleanup(false);
            alert("2Chat call service could not connect. Check your internet and try again.");
            return;
        }

        callState = "outgoing";
        show(receiver, "Calling...", [{ text: "✕", label: "Cancel call", end: true, action: () => {
            if (activeCallId) socket.emit("call:cancel", { callId: activeCallId });
            cleanup(false);
        }}]);
        socket.emit("call:start", { receiver });
    };

    socket.on("call:ice-config", data => {
        if (data && Array.isArray(data.iceServers) && data.iceServers.length) {
            configuredIceServers = data.iceServers;
        }
    });

    socket.on("connect", () => {
        socket.emit("join");
        socket.emit("call:presence", document.visibilityState === "visible" && document.hasFocus());
        iceConfigPromise = new Promise(resolve => {
            const fallback = setTimeout(resolve, 2500);
            socket.emit("call:ice-config");
            socket.once("call:ice-config", () => {
                clearTimeout(fallback);
                resolve();
            });
        });
    });

    const updatePresence = () => {
        socket.emit("call:presence", document.visibilityState === "visible" && document.hasFocus());
    };

    window.twoChatSetForeground = active => {
        socket.emit("call:presence", active === true);
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
                    var reason = error && error.message ? error.message : "Microphone permission was denied.";
                    alert("Could not access microphone: " + reason);
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

    // Read query parameters without requiring URLSearchParams (older Android WebView).
    function getCallQueryParam(name) {
        var query = (window.location.search || "").replace(/^\?/, "");
        var pairs = query ? query.split("&") : [];

        for (var i = 0; i < pairs.length; i++) {
            var parts = pairs[i].split("=");
            var key = parts.shift();

            try {
                key = decodeURIComponent(key.replace(/\+/g, " "));
            } catch (error) {
                continue;
            }

            if (key === name) {
                try {
                    return decodeURIComponent(parts.join("=").replace(/\+/g, " "));
                } catch (error) {
                    return parts.join("=");
                }
            }
        }

        return null;
    }

    // Add the call control only on a one-to-one chat page.
    const receiver = getCallQueryParam("user");
    const headerActions = document.querySelector(".chat-header .header-actions");
    if (receiver && headerActions) {
        const button = document.createElement("button");
        button.id = "twochat-call-button";
        button.type = "button";
        button.title = "Voice call";
        button.setAttribute("aria-label", "Start voice call");
        button.innerHTML = '<i class="fa-solid fa-phone"></i>';
        button.addEventListener("click", () => window.start2ChatVoiceCall(receiver));
        if (headerActions.firstChild) {
            headerActions.insertBefore(button, headerActions.firstChild);
        } else {
            headerActions.appendChild(button);
        }

        const historyLink = document.createElement("button");
        historyLink.type = "button";
        historyLink.title = "Call history";
        historyLink.setAttribute("aria-label", "Call history");
        historyLink.id = "twochat-call-history-button";
        historyLink.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i>';
        historyLink.style.cssText = "border:0;background:transparent;color:inherit;font-size:18px;padding:8px;cursor:pointer";
        historyLink.addEventListener("click", () => {
            location.href = "/call-history.html";
        });
        if (headerActions.firstChild) {
            headerActions.insertBefore(historyLink, headerActions.firstChild);
        } else {
            headerActions.appendChild(historyLink);
        }
    }
})();