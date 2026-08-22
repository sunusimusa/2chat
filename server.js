const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const postRoutes = require("./routes/postRoutes");
const messageRoutes = require("./routes/messageRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const groupRoutes = require("./routes/groupRoutes");
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


const app = express();
const server = http.createServer(app);

const io = new Server(server,{
  cors:{
    origin:"*"
  }
});

const path = require("path");

app.use(express.static(path.join(__dirname,"public")));
app.use(cors());

app.use(express.json({
    limit: "15mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "15mb"
}));

app.use("/api/auth",authRoutes);
app.use("/api/posts",postRoutes);
app.use("/api/messages",messageRoutes);
app.use("/api/users",userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/group-messages", groupMessageRoutes);
app.use("/api/notifications",
notificationRoutes
);
app.use("/api/friends", friendRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/shorts", shortVideoRoutes);
app.use("/api/wallet",walletRoutes);
app.use("/api/gifts", giftRoutes);
app.use("/api/withdrawals",withdrawalRoutes);
app.use("/api/monetization",monetizationRoutes);
app.use("/api/admin/monetization",adminMonetizationRoutes);
app.use("/api/admin",adminSetupRoutes);
app.use("/api/coin-packages",coinPackageRoutes);
app.use("/api/coin-purchases",coinPurchaseRoutes);

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "register.html"
        )
    );

});

mongoose.connect(process.env.MONGO_URI)
.then(()=>{

  console.log("✅ MongoDB Connected");


 io.on("connection",(socket)=>{

   console.log("🟢 User Connected");


   /* ==========================
GROUP CHAT
========================== */

socket.on("joinGroup",(groupId)=>{

    if(!groupId){
        return;
    }

    socket.join(
        String(groupId)
    );

    console.log(
        "👥 Joined Group:",
        groupId
    );

});


/* ==========================
GROUP MESSAGE
========================== */

socket.on("groupMessage",(message)=>{

    if(!message || !message.groupId){
        return;
    }

    socket.to(
        String(message.groupId)
    ).emit(
        "newGroupMessage",
        message
    );

});


/* ==========================
GROUP MESSAGE REACTION
========================== */
socket.on("groupMessageReaction",(message)=>{

    if(!message || !message._id){
        return;
    }

    socket.to(message.groupId)
    .emit(
        "groupMessageReaction",
        message
    );

});

/* ==========================
GROUP MESSAGE SEEN
========================== */

socket.on("groupMessageSeen", (data) => {

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

    socket.to(groupId).emit(
        "groupMessageSeen",
        {
            groupId,
            messageId,
            username
        }
    );

});

   /* ==========================
   GROUP MESSAGE PINNED
========================== */

socket.on("groupMessagePinned", (message) => {

    if (!message || !message._id || !message.groupId) {
        return;
    }

    socket.to(
        String(message.groupId)
    ).emit(
        "groupMessagePinned",
        message
    );

});


/* ==========================
   GROUP MESSAGE UNPINNED
========================== */

socket.on("groupMessageUnpinned", (message) => {

    if (!message || !message._id || !message.groupId) {
        return;
    }

    socket.to(
        String(message.groupId)
    ).emit(
        "groupMessageUnpinned",
        message
    );

});

   /* ==========================
   GROUP TYPING
========================== */

socket.on("groupTyping", (data) => {

    if (!data) {
        return;
    }

    const {
        groupId,
        username
    } = data;

    if (!groupId || !username) {
        return;
    }

    socket.to(String(groupId)).emit(
        "groupTyping",
        {
            username
        }
    );

});


/* ==========================
   GROUP STOP TYPING
========================== */

socket.on("groupStopTyping", (data) => {

    if (!data) {
        return;
    }

    const {
        groupId,
        username
    } = data;

    if (!groupId || !username) {
        return;
    }

    socket.to(String(groupId)).emit(
        "groupStopTyping",
        {
            username
        }
    );

});

   /* ==========================
   GROUP MESSAGE DELETED
========================== */

socket.on("groupMessageDeleted", (message) => {

    if(
        !message ||
        !message._id ||
        !message.groupId
    ){
        return;
    }

    socket.to(
        String(message.groupId)
    ).emit(
        "groupMessageDeleted",
        message
    );

});
   

   /* ==========================
   GROUP MESSAGE EDITED
========================== */

socket.on(
    "groupMessageEdited",
    (message)=>{

        if(!message || !message.groupId){
            return;
        }

        socket.to(
            message.groupId
        ).emit(
            "groupMessageEdited",
            message
        );

    }
);


socket.on("join", async (username) => {

socket.username = username;

socket.join(username);

await mongoose.model("User").updateOne(
{ username },
{
online: true
}
);

io.emit("userOnline", username);

console.log(username + " joined");

});

socket.on("typing", (data) => {

socket.to(data.receiver).emit("typing", {
sender: data.sender
});

});

socket.on("stopTyping", (data) => {

socket.to(data.receiver).emit("stopTyping");

});

socket.on("newMessage", (msg) => {

    // A sanar da receiver cewa an isar da message
    io.to(msg.receiver).emit("messageDelivered", {
        messageId: msg._id
    });

    // Receiver kaɗai zai karɓi sabon message
    io.to(msg.receiver).emit("receiveMessage", msg);

});
   
socket.on("messageSeen",(data)=>{

io.to(data.sender).emit("messageSeen",{
messageId:data.messageId
});

});

socket.on("disconnect", async () => {

    if(socket.username){

        await mongoose.model("User").updateOne(
            { username: socket.username },
            {
                online: false,
                lastSeen: new Date()
            }
        );

        io.emit("userOffline", socket.username);

    }

    console.log("🔴 User Disconnected");

});

}); // <-- Wannan yana rufe io.on("connection")

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log(`🚀 Server running on port ${PORT}`);

});

}) // <-- Wannan yana rufe .then()

.catch((err)=>{

    console.error("❌ MongoDB Error:", err.message);

});
