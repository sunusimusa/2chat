const Message =
require("../models/Message");

const cloudinary =
require("../services/cloudinary");

const Notification =
require("../models/Notification");

const User = require("../models/User");

// SEND MESSAGE

exports.sendMessage =
async(req,res)=>{

try{

const {
sender,
receiver,
text
} = req.body;

let image = "";

if(req.file){

const result =
await cloudinary.uploader.upload(
req.file.path,
{
folder:"2chat-messages"
}
);

image = result.secure_url;

}

const message =
await Message.create({
sender,
receiver,
text,
image
});

await Notification.create({

receiver:receiver,

sender:sender,

type:"message",

text:sender + " sent you a message 📨"

});  

res.json({
success:true,
message
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// GET CHAT

exports.getMessages =
async(req,res)=>{

try{

const {
sender,
receiver
} = req.query;

const messages =
await Message.find({
$or:[
{
sender,
receiver
},
{
sender:receiver,
receiver:sender
}
]
})
.sort({
createdAt:1
});

  await Message.updateMany(
{
sender:receiver,
receiver:sender,
seen:false
},
{
seen:true,
seenAt:new Date()
}
);

res.json({
success:true,
messages
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

exports.getChats = async (req, res) => {

try {

const { username } = req.params;

const messages = await Message.find({
$or: [
{ sender: username },
{ receiver: username }
]
}).sort({ createdAt: -1 });

const chats = {};

messages.forEach(msg => {

const otherUser =
msg.sender === username
? msg.receiver
: msg.sender;

if (!chats[otherUser]) {

chats[otherUser] = {
username: otherUser,
lastMessage: msg.text,
time: msg.createdAt
};

}

});

res.json({
success: true,
chats: Object.values(chats)
});

} catch (err) {

res.status(500).json({
success: false,
message: err.message
});

}

};
