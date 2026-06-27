const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const postRoutes =
require("./routes/postRoutes");

const messageRoutes =
require("./routes/messageRoutes");

const authRoutes = require("./routes/authRoutes");

const app = express();

const server = http.createServer(app);

const io = new Server(server,{
cors:{
origin:"*"
}
});

const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/posts",postRoutes);
app.use(
"/api/messages",
messageRoutes
);

app.get("/", (req, res) => {
  res.send("🚀 2Chat Server Running Successfully");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 3000;

    io.on("connection",(socket)=>{

console.log("🟢 User Connected");

socket.on("join",(username)=>{

socket.join(username);

console.log(username + " joined");

});

socket.on("disconnect",()=>{

console.log("🔴 User Disconnected");

});

});
    
    server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    });
    
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
  });
