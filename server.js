const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config();


// =====================================================
// CONTROLLERS
// =====================================================

const {
    flutterwaveWebhook
} = require("./controllers/flutterwaveWebhookController");


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

const friendRoutes =
    require("./routes/friendRoutes");

const statusRoutes =
    require("./routes/statusRoutes");

const shortVideoRoutes =
    require("./routes/shortVideoRoutes");

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
// FLUTTERWAVE WEBHOOK
// =====================================================
//
// IMPORTANT:
//
// Webhook yana buƙatar raw body kafin
// express.json() ya parse body.
// =====================================================

app.post(
    "/api/payments/flutterwave/webhook",

    express.raw({
        type: "application/json"
    }),

    (req, res, next) => {

        req.rawBody =
            req.body;


        try {

            req.body =
                JSON.parse(
                    req.body.toString(
                        "utf8"
                    )
                );


        } catch (err) {

            console.error(
                "FLUTTERWAVE WEBHOOK JSON ERROR:",
                err
            );


            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "Invalid webhook JSON."

                });

        }


        next();

    },

    flutterwaveWebhook
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
// SOCKET.IO
// =====================================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "🟢 User Connected"
        );


        // =================================================
        // JOIN GROUP
        // =================================================

        socket.on(
            "joinGroup",
            (groupId) => {

                if (!groupId) {
                    return;
                }


                socket.join(
                    String(groupId)
                );


                console.log(
                    "👥 Joined Group:",
                    groupId
                );

            }
        );


        // =================================================
        // GROUP MESSAGE
        // =================================================

        socket.on(
            "groupMessage",
            (message) => {

                if (
                    !message ||
                    !message.groupId
                ) {
                    return;
                }


                socket
                    .to(
                        String(
                            message.groupId
                        )
                    )
                    .emit(
                        "newGroupMessage",
                        message
                    );

            }
        );


        // =================================================
        // GROUP MESSAGE REACTION
        // =================================================

        socket.on(
            "groupMessageReaction",
            (message) => {

                if (
                    !message ||
                    !message._id ||
                    !message.groupId
                ) {
                    return;
                }


                socket
                    .to(
                        String(
                            message.groupId
                        )
                    )
                    .emit(
                        "groupMessageReaction",
                        message
                    );

            }
        );


        // =================================================
        // GROUP MESSAGE SEEN
        // =================================================

        socket.on(
            "groupMessageSeen",
            (data) => {

                if (!data) {
                    return;
                }


                const {
                    groupId,
                    messageId,
                    username
                } = data;


                if (
                    !groupId ||
                    !messageId ||
                    !username
                ) {
                    return;
                }


                socket
                    .to(
                        String(groupId)
                    )
                    .emit(
                        "groupMessageSeen",
                        {
                            groupId,
                            messageId,
                            username
                        }
                    );

            }
        );


        // =================================================
        // GROUP MESSAGE PINNED
        // =================================================

        socket.on(
            "groupMessagePinned",
            (message) => {

                if (
                    !message ||
                    !message._id ||
                    !message.groupId
                ) {
                    return;
                }


                socket
                    .to(
                        String(
                            message.groupId
                        )
                    )
                    .emit(
                        "groupMessagePinned",
                        message
                    );

            }
        );


        // =================================================
        // GROUP MESSAGE UNPINNED
        // =================================================

        socket.on(
            "groupMessageUnpinned",
            (message) => {

                if (
                    !message ||
                    !message._id ||
                    !message.groupId
                ) {
                    return;
                }


                socket
                    .to(
                        String(
                            message.groupId
                        )
                    )
                    .emit(
                        "groupMessageUnpinned",
                        message
                    );

            }
        );


        // =================================================
        // GROUP TYPING
        // =================================================

        socket.on(
            "groupTyping",
            (data) => {

                if (!data) {
                    return;
                }


                const {
                    groupId,
                    username
                } = data;


                if (
                    !groupId ||
                    !username
                ) {
                    return;
                }


                socket
                    .to(
                        String(groupId)
                    )
                    .emit(
                        "groupTyping",
                        {
                            username
                        }
                    );

            }
        );


        // =================================================
        // GROUP STOP TYPING
        // =================================================

        socket.on(
            "groupStopTyping",
            (data) => {

                if (!data) {
                    return;
                }


                const {
                    groupId,
                    username
                } = data;


                if (
                    !groupId ||
                    !username
                ) {
                    return;
                }


                socket
                    .to(
                        String(groupId)
                    )
                    .emit(
                        "groupStopTyping",
                        {
                            username
                        }
                    );

            }
        );


        // =================================================
        // GROUP MESSAGE DELETED
        // =================================================

        socket.on(
            "groupMessageDeleted",
            (message) => {

                if (
                    !message ||
                    !message._id ||
                    !message.groupId
                ) {
                    return;
                }


                socket
                    .to(
                        String(
                            message.groupId
                        )
                    )
                    .emit(
                        "groupMessageDeleted",
                        message
                    );

            }
        );


        // =================================================
        // GROUP MESSAGE EDITED
        // =================================================

        socket.on(
            "groupMessageEdited",
            (message) => {

                if (
                    !message ||
                    !message.groupId
                ) {
                    return;
                }


                socket
                    .to(
                        String(
                            message.groupId
                        )
                    )
                    .emit(
                        "groupMessageEdited",
                        message
                    );

            }
        );


        // =================================================
        // USER JOIN
        // =================================================

        socket.on(
            "join",
            async (username) => {

                try {

                    if (!username) {
                        return;
                    }


                    socket.username =
                        username;


                    socket.join(
                        username
                    );


                    await mongoose
                        .model("User")
                        .updateOne(

                            {
                                username
                            },

                            {
                                online:
                                    true
                            }

                        );


                    io.emit(
                        "userOnline",
                        username
                    );


                    console.log(
                        username +
                        " joined"
                    );


                } catch (err) {

                    console.error(
                        "SOCKET JOIN ERROR:",
                        err
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
                    !data.receiver
                ) {
                    return;
                }


                socket
                    .to(
                        data.receiver
                    )
                    .emit(
                        "typing",
                        {
                            sender:
                                data.sender
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
                    !data.receiver
                ) {
                    return;
                }


                socket
                    .to(
                        data.receiver
                    )
                    .emit(
                        "stopTyping"
                    );

            }
        );


        // =================================================
        // NEW MESSAGE
        // =================================================

        socket.on(
            "newMessage",
            (msg) => {

                if (
                    !msg ||
                    !msg.receiver
                ) {
                    return;
                }


                // Delivered
                io
                    .to(
                        msg.receiver
                    )
                    .emit(
                        "messageDelivered",
                        {
                            messageId:
                                msg._id
                        }
                    );


                // Receive message
                io
                    .to(
                        msg.receiver
                    )
                    .emit(
                        "receiveMessage",
                        msg
                    );

            }
        );


        // =================================================
        // MESSAGE SEEN
        // =================================================

        socket.on(
            "messageSeen",
            (data) => {

                if (
                    !data ||
                    !data.sender ||
                    !data.messageId
                ) {
                    return;
                }


                io
                    .to(
                        data.sender
                    )
                    .emit(
                        "messageSeen",
                        {
                            messageId:
                                data.messageId
                        }
                    );

            }
        );


        // =================================================
        // DISCONNECT
        // =================================================

        socket.on(
            "disconnect",
            async () => {

                try {

                    if (
                        socket.username
                    ) {

                        await mongoose
                            .model("User")
                            .updateOne(

                                {
                                    username:
                                        socket.username
                                },

                                {
                                    online:
                                        false,

                                    lastSeen:
                                        new Date()
                                }

                            );


                        io.emit(
                            "userOffline",
                            socket.username
                        );

                    }


                    console.log(
                        "🔴 User Disconnected"
                    );


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

        {
            name:
                "100 Coins",

            coins:
                100,

            price:
                100,

            currency:
                "NGN",

            sortOrder:
                1
        },

        {
            name:
                "200 Coins",

            coins:
                200,

            price:
                200,

            currency:
                "NGN",

            sortOrder:
                2
        },

        {
            name:
                "300 Coins",

            coins:
                300,

            price:
                300,

            currency:
                "NGN",

            sortOrder:
                3
        },

        {
            name:
                "500 Coins",

            coins:
                500,

            price:
                500,

            currency:
                "NGN",

            sortOrder:
                4
        },

        {
            name:
                "1,000 Coins",

            coins:
                1000,

            price:
                1000,

            currency:
                "NGN",

            sortOrder:
                5
        },

        {
            name:
                "1,500 Coins",

            coins:
                1500,

            price:
                1500,

            currency:
                "NGN",

            sortOrder:
                6
        },

        {
            name:
                "2,000 Coins",

            coins:
                2000,

            price:
                2000,

            currency:
                "NGN",

            sortOrder:
                7
        },

        {
            name:
                "3,000 Coins",

            coins:
                3000,

            price:
                3000,

            currency:
                "NGN",

            sortOrder:
                8
        },

        {
            name:
                "4,000 Coins",

            coins:
                4000,

            price:
                4000,

            currency:
                "NGN",

            sortOrder:
                9
        },

        {
            name:
                "5,000 Coins",

            coins:
                5000,

            price:
                5000,

            currency:
                "NGN",

            sortOrder:
                10
        },

        {
            name:
                "10,000 Coins",

            coins:
                10000,

            price:
                10000,

            currency:
                "NGN",

            sortOrder:
                11
        },

        {
            name:
                "20,000 Coins",

            coins:
                20000,

            price:
                20000,

            currency:
                "NGN",

            sortOrder:
                12
        }

    ];


    for (
        const item of packages
    ) {

        const existing =
            await CoinPackage.findOne({

                coins:
                    item.coins

            });


        if (!existing) {

            await CoinPackage.create(
                item
            );


            console.log(
                `🪙 Created coin package: ${item.name}`
            );

        } else {

            console.log(
                `🪙 Coin package exists: ${item.name}`
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
