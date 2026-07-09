const Message = require("../models/Message");
const cloudinary = require("../services/cloudinary");
const Notification = require("../models/Notification");
const User = require("../models/User");

// ================= SEND MESSAGE =================

exports.sendMessage = async (req, res) => {

try{

const { sender, receiver, text } = req.body;

let image = "";

if(req.file){

const result = await cloudinary.uploader.upload(
req.file.path,
{
resource_type:"image",
folder:"2chat-images"
}
);

image = result.secure_url;

}

const message = await Message.create({

sender,
receiver,
text,
image,
delivered:true,
deliveredAt:new Date()

});

await Notification.create({

receiver,
sender,
type:"message",
text:`${sender} sent you a message 📨`

});

res.json({
success:true,
message
});

}catch(err){

console.error(err);

res.status(500).json({
success:false,
message:err.message
});

}

};

// ================= SEND VOICE =================

exports.sendVoice = async (req, res) => {

try{

const { sender, receiver } = req.body;

if(!req.file){

return res.json({
success:false,
message:"No voice file uploaded."
});

}

const result = await cloudinary.uploader.upload(
req.file.path,
{
resource_type:"video",
folder:"2chat-voice"
}
);

const message = await Message.create({

sender,
receiver,
text:"",
image:"",
voice:result.secure_url,
delivered:true,
deliveredAt:new Date()

});

await Notification.create({

receiver,
sender,
type:"message",
text:`${sender} sent you a voice message 🎤`

});

res.json({
success:true,
message
});

}catch(err){

console.error(err);

res.status(500).json({
success:false,
message:err.message
});

}

};

// ================= GET CHAT =================

exports.getMessages = async (req,res)=>{

try{

const { sender, receiver } = req.query;

const messages = await Message.find({

$or:[
{sender,receiver},
{sender:receiver,receiver:sender}
]

}).sort({createdAt:1});

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

// ================= CHAT LIST =================

exports.getChats = async (req,res)=>{

try{

const { username } = req.params;

const messages = await Message.find({

$or:[
{sender:username},
{receiver:username}
]

}).sort({createdAt:-1});

const chats = {};

for(const msg of messages){

const otherUser =
msg.sender===username
?
msg.receiver
:
msg.sender;

if(!chats[otherUser]){

const user = await User.findOne({

username:otherUser

});

chats[otherUser]={

username:user?user.username:otherUser,
avatar:user?user.avatar:"",
online:user?user.online:false,
lastSeen:user?user.lastSeen:null,
lastMessage: msg.text
  ? msg.text
  : msg.image
  ? "📷 Image"
  : "Message",
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

// ================= REACTION =================

exports.reactMessage = async (req,res)=>{

try{

const { messageId, username, emoji } = req.body;

const message = await Message.findById(messageId);

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
