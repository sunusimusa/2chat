const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

require("dotenv").config();


// =====================================================
// CONTROLLERS
// =====================================================

const {
    paystackWebhook
} = require("./controllers/paystackWebhookController");

// =====================================================
// ROUTES
// =====================================================

const postRoutes =
    require("./routes/postRoutes");

const messageRoutes =
    require("./routes/messageRoutes");

const authRoutes =
    require("./routes/authRoutes");

const userRoutes =
    require("./routes/userRoutes");

const groupRoutes =
    require("./routes/groupRoutes");

const groupMessageRoutes =
    require("./routes/groupMessageRoutes");

const notificationRoutes =
    require("./routes/notificationRoutes");

const callRoutes =
    require("./routes/callRoutes");

const friendRoutes =
    require("./routes/friendRoutes");

const statusRoutes =
    require("./routes/statusRoutes");

const shortVideoRoutes =
    require("./routes/shortVideoRoutes");

const {
    startShortModerationWorker
} = require("./workers/shortModerationWorker");

const walletRoutes =
    require("./routes/walletRoutes");

const giftRoutes =
    require("./routes/giftRoutes");

const withdrawalRoutes =
    require("./routes/withdrawalRoutes");

const monetizationRoutes =
    require("./routes/monetizationRoutes");

const adminMonetizationRoutes =
    require("./routes/adminMonetizationRoutes");

const adminSetupRoutes =
    require("./routes/adminSetupRoutes");

const coinPackageRoutes =
    require("./routes/coinPackageRoutes");

const coinPurchaseRoutes =
    require("./routes/coinPurchaseRoutes");

const reportRoutes =
    require("./routes/reportRoutes");


// =====================================================
// MODELS
// =====================================================

const CoinPackage =
    require("./models/CoinPackage");


// =====================================================
// APP
// =====================================================

const app =
    express();

// Render runs Express behind a trusted proxy.
// Trust exactly one proxy hop.
app.set("trust proxy", 1);

const server =
    http.createServer(app);

// =====================================================
// SOCKET.IO
// =====================================================

const io =
    new Server(
        server,
        {
            cors: {
                origin: "*"
            }
        }
    );


// =====================================================
// SOCKET.IO JWT AUTHENTICATION
// =====================================================

io.use(async (socket, next) => {

    try {

        const token =
            socket.handshake.auth?.token;

        if (!token) {
            return next(
                new Error("Authentication required.")
            );
        }

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        const user =
            await mongoose
                .model("User")
                .findById(decoded.id)
                .select("-password");

        if (!user) {
            return next(
                new Error("User not found.")
            );
        }

        socket.user = user;
        socket.userId = String(user._id);
        socket.username = user.username;

        next();

    } catch (error) {

        console.error(
            "SOCKET AUTH ERROR:",
            error.message
        );

        next(
            new Error("Invalid or expired token.")
        );

    }

});

// =====================================================
// CORS
// =====================================================

app.use(
    cors()
);


// =====================================================
// STATIC PUBLIC FILES
// =====================================================
//
// Duk files:
//
// public/coinPayment.html
// public/css/...
// public/js/...
// public/images/...
//
// za su buɗe kai tsaye daga:
//
// /coinPayment.html
// /css/...
// /js/...
// /images/...
// =====================================================

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


// =====================================================
// COIN PAYMENT PAGE ALIAS
// =====================================================
//
// Wannan yana gyara tsohon:
//
// /html/coinPayment.html
//
// zuwa:
//
// public/coinPayment.html
//
// Don haka:
//
// /coinPayment.html
//
// da:
//
// /html/coinPayment.html
//
// duka za su buɗe page ɗin.
// =====================================================

app.get(
    "/html/coinPayment.html",
    (req, res) => {

        return res.sendFile(
            path.join(
                __dirname,
                "public",
                "coinPayment.html"
            )
        );

    }
);


// =====================================================
// PAYSTACK WEBHOOK
// =====================================================
//
// IMPORTANT:
// Paystack signature verification yana buƙatar
// raw request body kafin express.json() ya parse body.
// =====================================================

app.post(
    "/api/payments/paystack/webhook",

    express.raw({
        type: "application/json"
    }),

    (req, res, next) => {

        console.log(
    "📩 PAYSTACK WEBHOOK REQUEST RECEIVED"
);

        req.rawBody =
            req.body;

        try {

            req.body =
                JSON.parse(
                    req.body.toString("utf8")
                );

        } catch (err) {

            console.error(
                "PAYSTACK WEBHOOK JSON ERROR:",
                err
            );

            return res
                .status(400)
                .json({
                    success: false,
                    message: "Invalid webhook JSON."
                });

        }

        next();

    },

    paystackWebhook
);


// =====================================================
// BODY PARSERS
// =====================================================

app.use(
    express.json({
        limit: "15mb"
    })
);


app.use(
    express.urlencoded({
        extended: true,
        limit: "15mb"
    })
);


// =====================================================
// API ROUTES
// =====================================================

app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/posts",
    postRoutes
);


app.use(
    "/api/messages",
    messageRoutes
);


app.use(
    "/api/users",
    userRoutes
);


app.use(
    "/api/groups",
    groupRoutes
);


app.use(
    "/api/group-messages",
    groupMessageRoutes
);


app.use(
    "/api/notifications",
    notificationRoutes
);

app.use(
    "/api/calls",
    callRoutes
);


app.use(
    "/api/friends",
    friendRoutes
);


app.use(
    "/api/status",
    statusRoutes
);


app.use(
    "/api/shorts",
    shortVideoRoutes
);


app.use(
    "/api/wallet",
    walletRoutes
);


app.use(
    "/api/gifts",
    giftRoutes
);


app.use(
    "/api/withdrawals",
    withdrawalRoutes
);


app.use(
    "/api/monetization",
    monetizationRoutes
);


app.use(
    "/api/admin/monetization",
    adminMonetizationRoutes
);


app.use(
    "/api/admin",
    adminSetupRoutes
);


// =====================================================
// COIN PAYMENT ROUTES
// =====================================================

app.use(
    "/api/coin-packages",
    coinPackageRoutes
);


app.use(
    "/api/coin-purchases",
    coinPurchaseRoutes
);

app.use(
    "/api/reports",
    reportRoutes
);


// =====================================================
// HOME
// =====================================================

app.get(
    "/",
    (req, res) => {

        return res.sendFile(
            path.join(
                __dirname,
                "public",
                "register.html"
            )
        );

    }
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
    "/health",
    (req, res) => {

        return res.json({

            success:
                true,

            message:
                "2Chat server is running.",

            mongodb:
                mongoose.connection.readyState === 1
                    ? "connected"
                    : "disconnected",

            time:
                new Date().toISOString()

        });

    }
);


// =====================================================
// 2CHAT ONE-TO-ONE VOICE CALL SIGNALING
// =====================================================

const Call = require("./models/Call");
const callPresence = new Map();
const pendingCallTimers = new Map();
const callPresenceGraceTimers = new Map();

function clearPendingCallTimer(callId) {
    const timer = pendingCallTimers.get(String(callId));
    if (timer) clearTimeout(timer);
    pendingCallTimers.delete(String(callId));
}

async function markCallMissed(call) {
    if (!call || call.status !== "ringing") return;
    call.status = "missed";
    call.endedAt = new Date();
    await call.save();
    clearPendingCallTimer(call._id);

    const Notification = mongoose.model("Notification");
    await Notification.create({
        receiver: call.receiver,
        sender: call.caller,
        type: "missed_call",
        text: "Missed voice call from " + call.caller
    });

    io.to(call.receiver).emit("call:missed", {
        callId: String(call._id),
        caller: call.caller
    });
    io.to(call.receiver).emit("call:no-answer", {
        callId: String(call._id)
    });
    io.to(call.caller).emit("call:no-answer", {
        callId: String(call._id)
    });
}

// =====================================================
// SOCKET.IO
// =====================================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "🟢 User Connected"
        );

        // Register before the async join handler so the first visibility
        // update cannot be lost while the database online flag is written.
        socket.on("call:presence", (visible) => {
            if (!socket.username) return;
            const ids = callPresence.get(socket.username) || new Set();
            if (visible === true) ids.add(socket.id);
            else ids.delete(socket.id);
            if (ids.size) {
                callPresence.set(socket.username, ids);
                const graceTimer = callPresenceGraceTimers.get(socket.username);
                if (graceTimer) clearTimeout(graceTimer);
                callPresenceGraceTimers.delete(socket.username);
            } else {
                callPresence.delete(socket.username);
                // A short grace period prevents normal page-to-page navigation
                // from being mistaken for leaving the app.
                const existingTimer = callPresenceGraceTimers.get(socket.username);
                if (existingTimer) clearTimeout(existingTimer);
                const graceTimer = setTimeout(() => {
                    callPresenceGraceTimers.delete(socket.username);
                    const current = callPresence.get(socket.username);
                    if (current && current.size) return;
                    Call.find({ receiver: socket.username, status: "ringing" })
                        .then(calls => Promise.all(calls.map(markCallMissed)))
                        .catch(error => console.error("CALL PRESENCE ERROR:", error.message));
                }, 4000);
                callPresenceGraceTimers.set(socket.username, graceTimer);
            }
        });


        // =================================================
        // JOIN GROUP
        // =================================================

        socket.on(
    "joinGroup",
    async (groupId) => {

        try {

            if (!groupId || !socket.username) {
                return;
            }

            const Group = mongoose.model("Group");

            const group = await Group.findById(groupId);

            if (!group) {
                return;
            }

            const isMember =
                group.members.includes(socket.username) ||
                group.owner === socket.username;

            if (!isMember) {
                socket.emit(
                    "groupJoinError",
                    {
                        message: "You are not a member of this group."
                    }
                );

                return;
            }

            socket.join(String(group._id));

            console.log(
                "👥 Joined Group:",
                group._id,
                socket.username
            );

        } catch (error) {

            console.error(
                "JOIN GROUP ERROR:",
                error.message
            );

        }

    }
);


        // =================================================
        // GROUP MESSAGE
        // =================================================

        socket.on(
    "groupMessage",
    async (message) => {

        try {

            if (
                !message ||
                !message.groupId ||
                !socket.username
            ) {
                return;
            }

            const Group = mongoose.model("Group");

            const group = await Group.findById(
                message.groupId
            );

            if (!group) {
                return;
            }

            const isMember =
                group.members.includes(socket.username) ||
                group.owner === socket.username;

            if (!isMember) {
                return;
            }

            socket
                .to(String(group._id))
                .emit(
                    "newGroupMessage",
                    message
                );

        } catch (error) {

            console.error(
                "GROUP MESSAGE SOCKET ERROR:",
                error.message
            );

        }

    }
);


        // =================================================
        // GROUP MESSAGE REACTION
        // =================================================

        socket.on(
    "groupMessageReaction",
    async (message) => {

        try {

            if (
                !message ||
                !message._id ||
                !message.groupId ||
                !socket.username
            ) {
                return;
            }

            const Group = mongoose.model("Group");

            const group = await Group.findById(
                message.groupId
            );

            if (!group) {
                return;
            }

            const isMember =
                group.members.includes(socket.username) ||
                group.owner === socket.username;

            if (!isMember) {
                return;
            }

            socket
                .to(String(group._id))
                .emit(
                    "groupMessageReaction",
                    message
                );

        } catch (error) {

            console.error(
                "GROUP REACTION SOCKET ERROR:",
                error.message
            );

        }

    }
);


        // =================================================
        // GROUP MESSAGE SEEN
        // =================================================

        socket.on(
    "groupMessageSeen",
    async (data) => {

        try {

            if (
                !data ||
                !data.groupId ||
                !data.messageId ||
                !socket.username
            ) {
                return;
            }

            const Group = mongoose.model("Group");

            const group = await Group.findById(
                data.groupId
            );

            if (!group) {
                return;
            }

            const isMember =
                group.members.includes(socket.username) ||
                group.owner === socket.username;

            if (!isMember) {
                return;
            }

            socket
                .to(String(group._id))
                .emit(
                    "groupMessageSeen",
                    {
                        groupId: String(group._id),
                        messageId: data.messageId,
                        username: socket.username
                    }
                );

        } catch (error) {

            console.error(
                "GROUP MESSAGE SEEN ERROR:",
                error.message
            );

        }

    }
);
        


        // =================================================
        // GROUP MESSAGE PINNED
        // =================================================
socket.on(
    "groupMessagePinned",
    async (message) => {

        try {

            if (
                !message ||
                !message._id ||
                !message.groupId ||
                !socket.username
            ) {
                return;
            }

            const Group = mongoose.model("Group");

            const group = await Group.findById(
                message.groupId
            );

            if (!group) {
                return;
            }

            const isMember =
                group.members.includes(socket.username) ||
                group.owner === socket.username;

            if (!isMember) {
                return;
            }

            socket
                .to(String(group._id))
                .emit(
                    "groupMessagePinned",
                    message
                );

        } catch (error) {

            console.error(
                "GROUP MESSAGE PINNED ERROR:",
                error.message
            );

        }

    }
);
 


        // =================================================
        // GROUP MESSAGE UNPINNED
        // =================================================

        socket.on(
    "groupMessageUnpinned",
    async (message) => {

        try {

            if (
                !message ||
                !message._id ||
                !message.groupId ||
                !socket.username
            ) {
                return;
            }

            const Group = mongoose.model("Group");

            const group = await Group.findById(
                message.groupId
            );

            if (!group) {
                return;
            }

            const isMember =
                group.members.includes(socket.username) ||
                group.owner === socket.username;

            if (!isMember) {
                return;
            }

            socket
                .to(String(group._id))
                .emit(
                    "groupMessageUnpinned",
                    message
                );

        } catch (error) {

            console.error(
                "GROUP MESSAGE UNPINNED ERROR:",
                error.message
            );

        }

    }
);


        // =================================================
        // GROUP TYPING
        // =================================================

        socket.on(
    "groupTyping",
    async (data) => {

        try {

            if (
                !data ||
                !data.groupId ||
                !socket.username
            ) {
                return;
            }

            const Group = mongoose.model("Group");

            const group = await Group.findById(
                data.groupId
            );

            if (!group) {
                return;
            }

            const isMember =
                group.members.includes(socket.username) ||
                group.owner === socket.username;

            if (!isMember) {
                return;
            }

            socket
                .to(String(group._id))
                .emit(
                    "groupTyping",
                    {
                        username: socket.username
                    }
                );

        } catch (error) {

            console.error(
                "GROUP TYPING ERROR:",
                error.message
            );

        }

    }
);


        // =================================================
        // GROUP STOP TYPING
        // =================================================

        socket.on(
    "groupStopTyping",
    async (data) => {

        try {

            if (
                !data ||
                !data.groupId ||
                !socket.username
            ) {
                return;
            }

            const Group = mongoose.model("Group");

            const group = await Group.findById(
                data.groupId
            );

            if (!group) {
                return;
            }

            const isMember =
                group.members.includes(socket.username) ||
                group.owner === socket.username;

            if (!isMember) {
                return;
            }

            socket
                .to(String(group._id))
                .emit(
                    "groupStopTyping",
                    {
                        username: socket.username
                    }
                );

        } catch (error) {

            console.error(
                "GROUP STOP TYPING ERROR:",
                error.message
            );

        }

    }
);


        // =================================================
        // GROUP MESSAGE DELETED
        // =================================================

        socket.on(
    "groupMessageDeleted",
    async (message) => {

        try {

            if (
                !message ||
                !message._id ||
                !message.groupId ||
                !socket.username
            ) {
                return;
            }

            const Group = mongoose.model("Group");

            const group = await Group.findById(
                message.groupId
            );

            if (!group) {
                return;
            }

            const isMember =
                group.members.includes(socket.username) ||
                group.owner === socket.username;

            if (!isMember) {
                return;
            }

            socket
                .to(String(group._id))
                .emit(
                    "groupMessageDeleted",
                    message
                );

        } catch (error) {

            console.error(
                "GROUP MESSAGE DELETED ERROR:",
                error.message
            );

        }

    }
);


        // =================================================
        // GROUP MESSAGE EDITED
        // =================================================

        socket.on(
    "groupMessageEdited",
    async (message) => {

        try {

            if (
                !message ||
                !message._id ||
                !message.groupId ||
                !socket.username
            ) {
                return;
            }

            const Group = mongoose.model("Group");

            const group = await Group.findById(
                message.groupId
            );

            if (!group) {
                return;
            }

            const isMember =
                group.members.includes(socket.username) ||
                group.owner === socket.username;

            if (!isMember) {
                return;
            }

            socket
                .to(String(group._id))
                .emit(
                    "groupMessageEdited",
                    message
                );

        } catch (error) {

            console.error(
                "GROUP MESSAGE EDITED ERROR:",
                error.message
            );

        }

    }
);


        const authenticatedUsername = socket.username;

        socket.on("call:ice-config", () => {
            const iceServers = [
                { urls: "stun:stun.l.google.com:19302" }
            ];
            if (
                process.env.TURN_URL &&
                process.env.TURN_USERNAME &&
                process.env.TURN_CREDENTIAL
            ) {
                iceServers.push({
                    urls: process.env.TURN_URL.split(",").map(value => value.trim()),
                    username: process.env.TURN_USERNAME,
                    credential: process.env.TURN_CREDENTIAL
                });
            }
            socket.emit("call:ice-config", { iceServers });
        });

            socket.on("call:start", async (data = {}) => {
                try {
                    const receiver = String(data.receiver || "").trim();
                    if (!receiver || receiver === authenticatedUsername) {
                        socket.emit("call:error", { message: "Invalid call recipient." });
                        return;
                    }

                    const User = mongoose.model("User");
                    const target = await User.findOne({ username: receiver }).select("_id username");
                    if (!target) {
                        socket.emit("call:error", { message: "User not found." });
                        return;
                    }

                    const activeIds = callPresence.get(receiver);
                    const targetSockets = activeIds ? [...activeIds] : [];
                    const active = targetSockets.some(id => {
                        const peer = io.sockets.sockets.get(id);
                        return peer && peer.connected;
                    });

                    if (!active) {
                        const missed = await Call.create({
                            caller: authenticatedUsername,
                            receiver,
                            status: "missed",
                            endedAt: new Date()
                        });
                        const Notification = mongoose.model("Notification");
                        await Notification.create({
                            receiver,
                            sender: authenticatedUsername,
                            type: "missed_call",
                            text: "Missed voice call from " + authenticatedUsername
                        });
                        socket.emit("call:unavailable", {
                            callId: String(missed._id),
                            receiver,
                            message: "User is not active in 2Chat."
                        });
                        return;
                    }

                    const call = await Call.create({
                        caller: authenticatedUsername,
                        receiver,
                        status: "ringing"
                    });

                    const timer = setTimeout(() => {
                        markCallMissed(call).catch(err =>
                            console.error("CALL TIMEOUT ERROR:", err.message)
                        );
                        socket.emit("call:no-answer", { callId: String(call._id) });
                    }, 30000);
                    pendingCallTimers.set(String(call._id), timer);

                    io.to(receiver).emit("call:incoming", {
                        callId: String(call._id),
                        caller: authenticatedUsername
                    });
                    socket.emit("call:outgoing", {
                        callId: String(call._id),
                        receiver
                    });
                } catch (error) {
                    console.error("CALL START ERROR:", error.message);
                    socket.emit("call:error", { message: "Unable to start call." });
                }
            });

            socket.on("call:accept", async ({ callId } = {}) => {
                try {
                    const call = await Call.findOne({
                        _id: callId, receiver: authenticatedUsername, status: "ringing"
                    });
                    if (!call) return;
                    call.status = "accepted";
                    call.answeredAt = new Date();
                    await call.save();
                    clearPendingCallTimer(call._id);
                    io.to(call.caller).emit("call:accepted", { callId: String(call._id) });
                } catch (error) {
                    console.error("CALL ACCEPT ERROR:", error.message);
                }
            });

            socket.on("call:decline", async ({ callId } = {}) => {
                try {
                    const call = await Call.findOne({
                        _id: callId, receiver: authenticatedUsername, status: "ringing"
                    });
                    if (!call) return;
                    call.status = "declined";
                    call.endedAt = new Date();
                    await call.save();
                    clearPendingCallTimer(call._id);
                    io.to(call.caller).emit("call:declined", { callId: String(call._id) });
                } catch (error) {
                    console.error("CALL DECLINE ERROR:", error.message);
                }
            });

            socket.on("call:cancel", async ({ callId } = {}) => {
                try {
                    const call = await Call.findOne({
                        _id: callId, caller: authenticatedUsername, status: "ringing"
                    });
                    if (!call) return;
                    call.status = "cancelled";
                    call.endedAt = new Date();
                    await call.save();
                    clearPendingCallTimer(call._id);
                    io.to(call.receiver).emit("call:cancelled", { callId: String(call._id) });
                } catch (error) {
                    console.error("CALL CANCEL ERROR:", error.message);
                }
            });

            socket.on("call:signal", async (data = {}) => {
                try {
                    const call = await Call.findOne({
                        _id: data.callId,
                        status: "accepted",
                        $or: [{ caller: authenticatedUsername }, { receiver: authenticatedUsername }]
                    }).lean();
                    if (!call || !data.signal || !["offer", "answer", "ice-candidate"].includes(data.kind)) return;
                    const peer = call.caller === authenticatedUsername ? call.receiver : call.caller;
                    io.to(peer).emit("call:signal", {
                        callId: String(call._id),
                        kind: data.kind,
                        signal: data.signal
                    });
                } catch (error) {
                    console.error("CALL SIGNAL ERROR:", error.message);
                }
            });

            socket.on("call:end", async ({ callId } = {}) => {
                try {
                    const call = await Call.findOne({
                        _id: callId,
                        status: "accepted",
                        $or: [{ caller: authenticatedUsername }, { receiver: authenticatedUsername }]
                    });
                    if (!call) return;
                    call.status = "ended";
                    call.endedAt = new Date();
                    if (call.answeredAt) {
                        call.durationSeconds = Math.max(0, Math.floor((call.endedAt - call.answeredAt) / 1000));
                    }
                    await call.save();
                    const peer = call.caller === authenticatedUsername ? call.receiver : call.caller;
                    io.to(peer).emit("call:ended", { callId: String(call._id) });
                } catch (error) {
                    console.error("CALL END ERROR:", error.message);
                }
            });

        // =================================================
        // USER JOIN
        // =================================================

        socket.on(
    "join",
    async () => {

        try {

            const username = socket.username;

            if (!username || !socket.userId) {
                return;
            }

            socket.join(username);

            // Foreground call presence is updated by the call client.

            await mongoose
                .model("User")
                .updateOne(
                    {
                        _id: socket.userId
                    },
                    {
                        online: true
                    }
                );

            io.emit(
                "userOnline",
                username
            );



            console.log(
                username + " joined"
            );

        } catch (err) {

            console.error(
                "SOCKET JOIN ERROR:",
                err.message
            );

        }

    }
);


        // =================================================
        // TYPING
        // =================================================

        socket.on(
    "typing",
    (data) => {

        if (
            !data ||
            !data.receiver ||
            !socket.username
        ) {
            return;
        }

        socket
            .to(data.receiver)
            .emit(
                "typing",
                {
                    sender: socket.username
                }
            );

    }
);


        // =================================================
        // STOP TYPING
        // =================================================

        socket.on(
    "stopTyping",
    (data) => {

        if (
            !data ||
            !data.receiver ||
            !socket.username
        ) {
            return;
        }

        socket
            .to(data.receiver)
            .emit(
                "stopTyping",
                {
                    sender: socket.username
                }
            );

    }
);


        // =================================================
        // NEW MESSAGE
        // =================================================

        socket.on(
    "newMessage",
    async (msg) => {

        try {

            if (
                !msg ||
                !msg._id ||
                !msg.receiver ||
                !socket.username
            ) {
                return;
            }

            const Message = mongoose.model("Message");

            const savedMessage = await Message.findOne({
                _id: msg._id,
                sender: socket.username,
                receiver: msg.receiver
            }).lean();

            if (!savedMessage) {
                return;
            }

            io
                .to(msg.receiver)
                .emit(
                    "messageDelivered",
                    {
                        messageId: String(savedMessage._id)
                    }
                );

            io
                .to(msg.receiver)
                .emit(
                    "receiveMessage",
                    savedMessage
                );

        } catch (error) {

            console.error(
                "NEW MESSAGE SOCKET ERROR:",
                error.message
            );

        }

    }
);


        // =================================================
        // MESSAGE SEEN
        // =================================================

        socket.on(
    "messageSeen",
    async (data) => {

        try {

            if (
                !data ||
                !data.messageId ||
                !socket.username
            ) {
                return;
            }

            const Message = mongoose.model("Message");

            const message = await Message.findOne({
                _id: data.messageId,
                receiver: socket.username,
                sender: data.sender
            }).lean();

            if (!message) {
                return;
            }

            io
                .to(message.sender)
                .emit(
                    "messageSeen",
                    {
                        messageId: String(message._id)
                    }
                );

        } catch (error) {

            console.error(
                "MESSAGE SEEN SOCKET ERROR:",
                error.message
            );

        }

    }
);


        // =================================================
        // DISCONNECT
        // =================================================

        socket.on(
    "disconnect",
    async () => {

        try {

            if (socket.username) {

                const presence = callPresence.get(socket.username);
                if (presence) {
                    presence.delete(socket.id);
                    if (!presence.size) callPresence.delete(socket.username);
                }

                // Check remaining active connections
                const remainingSockets = await io
                    .in(socket.username)
                    .fetchSockets();

                // Only mark offline if no connection remains
                if (remainingSockets.length === 0) {

                    await mongoose
                        .model("User")
                        .updateOne(
                            {
                                username: socket.username
                            },
                            {
                                online: false,
                                lastSeen: new Date()
                            }
                        );

                    io.emit(
                        "userOffline",
                        socket.username
                    );

                }

            }

            console.log("🔴 User Disconnected");

        } catch (err) {

            console.error(
                "SOCKET DISCONNECT ERROR:",
                err
            );

          }

        }

     );
        
   }
    
);


// =====================================================
// AUTO SEED COIN PACKAGES
// =====================================================

async function seedCoinPackages() {

    const packages = [

        // =====================================================
        // 🇳🇬 NGN PACKAGES
        // $1 = ₦1,300
        // =====================================================

        {
            name: "100 Coins",
            coins: 100,
            price: 1300,
            currency: "NGN",
            sortOrder: 1
        },

        {
            name: "200 Coins",
            coins: 200,
            price: 2600,
            currency: "NGN",
            sortOrder: 2
        },

        {
            name: "300 Coins",
            coins: 300,
            price: 3900,
            currency: "NGN",
            sortOrder: 3
        },

        {
            name: "500 Coins",
            coins: 500,
            price: 6500,
            currency: "NGN",
            sortOrder: 4
        },

        {
            name: "1,000 Coins",
            coins: 1000,
            price: 13000,
            currency: "NGN",
            sortOrder: 5
        },

        {
            name: "1,500 Coins",
            coins: 1500,
            price: 19500,
            currency: "NGN",
            sortOrder: 6
        },

        {
            name: "2,000 Coins",
            coins: 2000,
            price: 26000,
            currency: "NGN",
            sortOrder: 7
        },

        {
            name: "3,000 Coins",
            coins: 3000,
            price: 39000,
            currency: "NGN",
            sortOrder: 8
        },

        {
            name: "4,000 Coins",
            coins: 4000,
            price: 52000,
            currency: "NGN",
            sortOrder: 9
        },

        {
            name: "5,000 Coins",
            coins: 5000,
            price: 65000,
            currency: "NGN",
            sortOrder: 10
        },

        {
            name: "10,000 Coins",
            coins: 10000,
            price: 130000,
            currency: "NGN",
            sortOrder: 11
        },

        {
            name: "20,000 Coins",
            coins: 20000,
            price: 260000,
            currency: "NGN",
            sortOrder: 12
        },


        // =====================================================
        // 🇺🇸 USD PACKAGES
        // =====================================================

        {
            name: "100 Coins",
            coins: 100,
            price: 1,
            currency: "USD",
            sortOrder: 101
        },

        {
            name: "200 Coins",
            coins: 200,
            price: 2,
            currency: "USD",
            sortOrder: 102
        },

        {
            name: "300 Coins",
            coins: 300,
            price: 3,
            currency: "USD",
            sortOrder: 103
        },

        {
            name: "500 Coins",
            coins: 500,
            price: 5,
            currency: "USD",
            sortOrder: 104
        },

        {
            name: "1,000 Coins",
            coins: 1000,
            price: 10,
            currency: "USD",
            sortOrder: 105
        },

        {
            name: "1,500 Coins",
            coins: 1500,
            price: 15,
            currency: "USD",
            sortOrder: 106
        },

        {
            name: "2,000 Coins",
            coins: 2000,
            price: 20,
            currency: "USD",
            sortOrder: 107
        },

        {
            name: "3,000 Coins",
            coins: 3000,
            price: 30,
            currency: "USD",
            sortOrder: 108
        },

        {
            name: "4,000 Coins",
            coins: 4000,
            price: 40,
            currency: "USD",
            sortOrder: 109
        },

        {
            name: "5,000 Coins",
            coins: 5000,
            price: 50,
            currency: "USD",
            sortOrder: 110
        },

        {
            name: "10,000 Coins",
            coins: 10000,
            price: 100,
            currency: "USD",
            sortOrder: 111
        },

        {
            name: "20,000 Coins",
            coins: 20000,
            price: 200,
            currency: "USD",
            sortOrder: 112
        }

    ];


    for (
        const item of packages
    ) {

        const existing =
            await CoinPackage.findOne({

                coins:
                    item.coins,

                currency:
                    item.currency

            });


        if (!existing) {

            await CoinPackage.create(
                item
            );

            console.log(
                `🪙 Created coin package: ${item.name} - ${item.currency}`
            );

        } else {

            await CoinPackage.updateOne(

                {
                    coins:
                        item.coins,

                    currency:
                        item.currency
                },

                {
                    $set:
                        item
                }

            );

            console.log(
                `🔄 Updated coin package: ${item.name} - ${item.currency}`
            );

        }

    }


    console.log(
        "✅ Coin packages auto-seed completed."
    );

}


// =====================================================
// START SERVER
// =====================================================

const PORT =
    process.env.PORT ||
    3000;


mongoose
    .connect(
        process.env.MONGO_URI
    )
    .then(
        async () => {

            console.log(
                "✅ MongoDB Connected"
            );


            // =============================================
            // SEED COIN PACKAGES
            // =============================================

            await seedCoinPackages();


         // =============================================
         // START SHORT MODERATION WORKER
         // =============================================

           startShortModerationWorker();


          // =============================================
          // START SERVER
          // =============================================

              server.listen(
                PORT,
                () => {

                    console.log(
                        `🚀 Server running on port ${PORT}`
                    );

                    console.log(
                        `💳 Payment page: /coinPayment.html`
                    );

                    console.log(
                        `💳 Payment alias: /html/coinPayment.html`
                    );

                }
            );

        }
    )
    .catch(
        (err) => {

            console.error(
                "❌ MongoDB Error:",
                err.message
            );

            process.exit(1);

        }
    );


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    app,
    server,
    io
};
