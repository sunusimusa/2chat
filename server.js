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
const notificationRoutes =
require("./routes/notificationRoutes");
const friendRoutes =
require("./routes/friendRoutes");
const statusRoutes =
require("./routes/statusRoutes");
const shortVideoRoutes =
require("./routes/shortVideoRoutes");


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
app.use(express.json());

app.use("/api/auth",authRoutes);
app.use("/api/posts",postRoutes);
app.use("/api/messages",messageRoutes);
app.use("/api/users",userRoutes);
app.use("/api/notifications",
notificationRoutes
);
app.use("/api/friends", friendRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/shorts", shortVideoRoutes);

app.get("/",(req,res)=>{
  res.send("🚀 2Chat Server Running Successfully");
});

mongoose.connect(process.env.MONGO_URI)
.then(()=>{

  console.log("✅ MongoDB Connected");


 io.on("connection",(socket)=>{
   
   socket.inCall = false;

   function getSocketByUsername(username){

    for(const [,s] of io.of("/").sockets){

        if(s.username === username){

            return s;

        }

    }

    return null;

}

socket.on("voiceCall",(data)=>{

    const targetSocket = getSocketByUsername(data.receiver);

    if(!targetSocket){
        return;
    }

    if(targetSocket.inCall){

        io.to(data.caller).emit("voiceCallBusy");

        return;

    }

    // Kira ya shigo, ka sanya shi Busy nan take
    targetSocket.inCall = true;

  activeCalls[data.caller] = data.receiver;
activeCalls[data.receiver] = data.caller;

    io.to(data.receiver).emit("incomingVoiceCall",{
        caller:data.caller
    });

});

   socket.on("videoCall",(data)=>{

    io.to(data.receiver).emit("incomingVideoCall",{

        caller: data.caller

    });

});

socket.on("acceptVoiceCall",(data)=>{
  
  socket.inCall = true;

io.to(data.caller).emit("voiceCallAccepted",{

receiver:data.receiver

});

});

socket.on("rejectVoiceCall",(data)=>{

const callerSocket = getSocketByUsername(data.caller);

if(callerSocket){
    callerSocket.inCall = false;
}

delete activeCalls[data.caller];
delete activeCalls[data.receiver];

socket.inCall = false;

io.to(data.caller).emit("voiceCallRejected",{

receiver:data.receiver

});

});

socket.on("webrtcOffer",(data)=>{

    io.to(data.receiver).emit("webrtcOffer",{

        caller: socket.username,
        receiver: data.receiver,
        offer: data.offer

    });

});

socket.on("webrtcAnswer",(data)=>{

    io.to(data.receiver).emit("webrtcAnswer",{

        answer: data.answer,

        sender: socket.username

    });

});

socket.on("iceCandidate",(data)=>{

    io.to(data.receiver).emit("iceCandidate",{

        candidate: data.candidate,

        sender: socket.username

    });

});

   socket.on("endVoiceCall",(data)=>{

    socket.inCall = false;

    const otherSocket =
    getSocketByUsername(data.receiver);

    if(otherSocket){

        otherSocket.inCall = false;

    }

    delete activeCalls[socket.username];
    delete activeCalls[data.receiver];

    io.to(data.receiver).emit("voiceCallEnded");

});

console.log("🟢 User Connected");

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

io.to(msg.receiver).emit("messageDelivered",{
messageId:msg._id
});

io.to(msg.receiver).emit("receiveMessage", msg);

io.to(msg.sender).emit("receiveMessage", msg);

});

socket.on("messageSeen",(data)=>{

io.to(data.sender).emit("messageSeen",{
messageId:data.messageId
});

});

const activeCalls = {};

socket.on("disconnect", async () => {

  const partner = activeCalls[socket.username];

if(partner){

    const partnerSocket =
    getSocketByUsername(partner);

    if(partnerSocket){

        partnerSocket.inCall = false;

        io.to(partner).emit("voiceCallEnded");

    }

    delete activeCalls[socket.username];
    delete activeCalls[partner];

}

socket.inCall = false;

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

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

console.log(`🚀 Server running on port ${PORT}`);

});

})
.catch((err)=>{

console.error("❌ MongoDB Error:", err.message);

});  
