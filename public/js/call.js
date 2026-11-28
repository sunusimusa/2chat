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
    let configuredIceServers = [{ urls: "stun:stun.l.google.com:19302" }];
    let iceConfigPromise = null;

    const style = document.createElement("style");
    style.textContent = `
      #twochat-call-layer{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;overflow-y:auto;background:radial-gradient(ellipse at 50% 22%,#1d4165 0%,#101d35 42%,#07111f 100%);font-family:Inter,Arial,sans-serif;color:#fff;padding:24px 20px;box-sizing:border-box}
      #twochat-call-card{width:100%;max-width:520px;min-height:min(720px,calc(100dvh - 48px));display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:28px;padding:clamp(28px,7vh,64px) 20px 26px;box-sizing:border-box;border:1px solid rgba(255,255,255,.09);border-radius:32px;background:linear-gradient(160deg,rgba(27,48,76,.88),rgba(10,22,40,.94));box-shadow:0 28px 90px rgba(0,0,0,.42);text-align:center}
      .twochat-call-top{width:100%;display:flex;justify-content:center;align-items:center}
      .twochat-call-label{font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#91a9c6}
      .twochat-call-profile{display:flex;flex-direction:column;align-items:center;gap:18px;width:100%}
      #twochat-call-avatar{width:clamp(112px,31vw,154px);height:clamp(112px,31vw,154px);display:grid;place-items:center;border-radius:50%;font-size:clamp(38px,10vw,54px);font-weight:750;color:#fff;background:linear-gradient(145deg,#3998df,#6258d9);border:5px solid rgba(255,255,255,.13);box-shadow:0 0 0 12px rgba(91,153,220,.08),0 18px 50px rgba(0,0,0,.25)}
      #twochat-call-title{font-size:clamp(25px,7vw,34px);font-weight:750;line-height:1.2;margin:4px 0 0;overflow-wrap:anywhere}
      #twochat-call-status{font-size:16px;color:#b9c9dc;margin:0;min-height:24px}
      #twochat-call-timer{font-size:16px;font-variant-numeric:tabular-nums;letter-spacing:2px;color:#e8f1fb;min-height:20px}
      .twochat-call-wave{height:38px;display:flex;align-items:center;justify-content:center;gap:5px;opacity:.9}
      .twochat-call-wave span{display:block;width:4px;height:9px;border-radius:5px;background:#60b8f5;animation:twochat-wave .85s ease-in-out infinite alternate}
      .twochat-call-wave span:nth-child(2n){animation-delay:.18s}.twochat-call-wave span:nth-child(3n){animation-delay:.34s}.twochat-call-wave span:nth-child(4n){animation-delay:.5s}
      #twochat-call-layer:not(.is-active) .twochat-call-wave span{animation-play-state:paused;opacity:.35}
      @keyframes twochat-wave{from{height:7px}to{height:32px}}
      .twochat-call-actions{width:100%;display:flex;justify-content:center;align-items:center;gap:22px;flex-wrap:wrap}
      .twochat-call-actions button{width:68px;height:68px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.15);border-radius:50%;background:#263c57;color:#fff;font-size:25px;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer;transition:transform .15s,filter .15s}
      .twochat-call-actions button:active{transform:scale(.94)}
      .twochat-call-actions button.accept{background:linear-gradient(145deg,#24c875,#119b58)}
      .twochat-call-actions button.end{background:linear-gradient(145deg,#ff5b62,#d92338)}
      .twochat-call-actions button:focus-visible{outline:3px solid #8bd0ff;outline-offset:4px}
      #twochat-call-audio{display:none}
      #twochat-call-button{border:0;background:transparent;color:inherit;font-size:20px;padding:8px;cursor:pointer}
      @media(max-height:560px){#twochat-call-card{min-height:0;padding:20px;gap:12px}.twochat-call-profile{gap:8px}#twochat-call-avatar{width:76px;height:76px;font-size:30px}.twochat-call-actions button{width:56px;height:56px}}
      @media(prefers-reduced-motion:reduce){.twochat-call-wave span{animation:none}}
    `;
    document.head.appendChild(style);

    const layer = document.createElement("div");
    layer.id = "twochat-call-layer";
    layer.innerHTML = `
      <section id="twochat-call-card" role="dialog" aria-modal="true" aria-labelledby="twochat-call-title">
        <div class="twochat-call-top"><span class="twochat-call-label">2CHAT VOICE CALL</span></div>
        <div class="twochat-call-profile">
          <div id="twochat-call-avatar" aria-hidden="true">2C</div>
          <h2 id="twochat-call-title">Voice Call</h2>
          <p id="twochat-call-status">Connecting...</p>
          <div id="twochat-call-timer"> </div>
          <div class="twochat-call-wave" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="twochat-call-actions" id="twochat-call-actions"></div>
        <audio id="twochat-call-audio" autoplay playsinline></audio>
      </section>`;
    document.body.appendChild(layer);

    const title = layer.querySelector("#twochat-call-title");
    const status = layer.querySelector("#twochat-call-status");
    const actions = layer.querySelector("#twochat-call-actions");
    const remoteAudio = layer.querySelector("#twochat-call-audio");
    const avatar = layer.querySelector("#twochat-call-avatar");
    const timerDisplay = layer.querySelector("#twochat-call-timer");
    let callStartedAt = null;
    let callTimerInterval = null;
    let microphoneMuted = false;

    function show(name, message, buttons) {
        title.textContent = name || "Voice Call";
        status.textContent = message || "";
        const initials = String(name || "2Chat").trim().split(/\\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
        avatar.textContent = initials || "2C";
        actions.innerHTML = "";
        buttons.forEach(item => {
            const button = document.createElement("button");
            button.className = item.end ? "end" : item.accept ? "accept" : "";
            button.type = "button";
            button.innerHTML = item.icon || item.text || "";
            button.setAttribute("aria-label", item.label);
            button.addEventListener("click", item.action);
            actions.appendChild(button);
        });
        layer.style.display = "flex";
        layer.classList.toggle("is-active", /connected|connecting audio/i.test(message || ""));
    }

    function stopCallTimer() {
        if (callTimerInterval) clearInterval(callTimerInterval);
        callTimerInterval = null;
        callStartedAt = null;
        timerDisplay.textContent = "";
    }

    function startCallTimer() {
        if (callTimerInterval) return;
        callStartedAt = Date.now();
        const tick = () => {
            const seconds = Math.floor((Date.now() - callStartedAt) / 1000);
            const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
            const ss = String(seconds % 60).padStart(2, "0");
            timerDisplay.textContent = mm + ":" + ss;
        };
        tick();
        callTimerInterval = setInterval(tick, 1000);
    }

    function activeCallButtons() {
        return [
            { icon: '<i class="fa-solid fa-microphone-slash"></i>', text: "Mute", label: microphoneMuted ? "Unmute microphone" : "Mute microphone", action: () => {
                microphoneMuted = !microphoneMuted;
                if (localStream) localStream.getAudioTracks().forEach(track => { track.enabled = !microphoneMuted; });
                const muteButton = actions.querySelector("button:not(.end)");
                if (muteButton) {
                    muteButton.innerHTML = microphoneMuted ? '<i class="fa-solid fa-microphone"></i>' : '<i class="fa-solid fa-microphone-slash"></i>';
                    muteButton.setAttribute("aria-label", microphoneMuted ? "Unmute microphone" : "Mute microphone");
                }
            }},
            { icon: '<i class="fa-solid fa-phone-slash"></i>', text: "End", label: "End call", end: true, action: () => cleanup(true) }
        ];
    }

    function showActiveCall(message) {
        show(title.textContent, message || "Call connected", activeCallButtons());
    }

    function hide() {
        layer.style.display = "none";
        layer.classList.remove("is-active");
        actions.innerHTML = "";
        stopCallTimer();
        microphoneMuted = false;
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

    function requestNativeCallMicrophonePermission() {
        if (!window.AndroidVoiceRecorder ||
                typeof window.AndroidVoiceRecorder.requestCallMicrophonePermission !== "function") {
            return Promise.resolve(true);
        }

        return new Promise(resolve => {
            let settled = false;
            const finish = granted => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                window.on2ChatMicrophonePermissionResult = null;
                resolve(granted === true);
            };
            const timeout = setTimeout(() => finish(false), 20000);
            window.on2ChatMicrophonePermissionResult = finish;

            try {
                window.AndroidVoiceRecorder.requestCallMicrophonePermission();
            } catch (_) {
                finish(false);
            }
        });
    }

    async function getMicrophoneStream() {
        const nativePermissionGranted = await requestNativeCallMicrophonePermission();
        if (!nativePermissionGranted) {
            throw new Error("Please allow microphone permission for 2Chat in Android Settings, then try again.");
        }

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
                layer.classList.add("is-active");
                startCallTimer();
                showActiveCall("Call connected");
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
        stopCallTimer();
        microphoneMuted = false;
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
        const foreground = document.visibilityState === "visible" && document.hasFocus();
        socket.emit("call:presence", foreground);
        if (foreground) socket.emit("call:resume-pending");
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
        const foreground = document.visibilityState === "visible" && document.hasFocus();
        socket.emit("call:presence", foreground);
        if (foreground && socket.connected) socket.emit("call:resume-pending");
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
            { icon: '<i class="fa-solid fa-phone"></i>', text: "Accept", label: "Accept call", accept: true, action: async () => {
                stopRingtone();
                try {
                    await ensurePeer();
                    callState = "connected";
                    socket.emit("call:accept", { callId: activeCallId });
                    showActiveCall("Connecting audio...");
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
            showActiveCall("Connecting audio...");
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