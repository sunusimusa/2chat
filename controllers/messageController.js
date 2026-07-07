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
let voice = "";

if(req.file){

if(req.file.mimetype.startsWith("image")){

const result = await cloudinary.uploader.upload(
req.file.path,
{
folder:"2chat-images"
}
);

image = result.secure_url;

}

else if(req.file.mimetype.startsWith("audio")){

const result = await cloudinary.uploader.upload(
req.file.path,
{
resource_type:"auto",
folder:"2chat-voice"
}
);

voice = result.secure_url;

console.log("VOICE URL:", voice);
console.log("MIME:", req.file.mimetype);

}

}
  
const message =
await Message.create({
sender,
receiver,
text,
image,
voice
});
  
message.delivered = true;

message.deliveredAt = new Date();

await message.save();  

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
$or:[
{ sender: username },
{ receiver: username }
]
}).sort({ createdAt:-1 });

const chats = {};

for (const msg of messages){

const otherUser =
msg.sender === username
? msg.receiver
: msg.sender;

if(!chats[otherUser]){

const user = await User.findOne({
username: otherUser
});

chats[otherUser] = {

username: user ? user.username : otherUser,

avatar: user ? user.avatar : "",

online: user ? user.online : false,

lastSeen: user ? user.lastSeen : null,

lastMessage: msg.text,

time: msg.createdAt

};

}

}

res.json({

success:true,

chats:Object.values(chats)

});

}catch(err){

res.status(500).json({

success:false,

message:err.message

});

}

};

exports.reactMessage = async (req,res)=>{

try{

const {
messageId,
username,
emoji
} = req.body;

const message =
await Message.findById(messageId);

if(!message){

return res.json({
success:false,
message:"Message not found"
});

}

const oldReaction =
message.reactions.find(
r=>r.username===username
);

if(oldReaction){

oldReaction.emoji = emoji;

}else{

message.reactions.push({
username,
emoji
});

}

await message.save();

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
