const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");
const Notification = require("../models/Notification");
const User = require("../models/User");
const streamifier = require("streamifier");

// ================= SEND MESSAGE =================

exports.sendMessage = async (req, res) => {

try{

const {
sender,
receiver,
text,
replyTo,
replyText,
replyImage,
replyVoice,
replyUser
} = req.body;
  
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

replyTo: replyTo || null,
replyText: replyText || "",
replyImage: replyImage || "",
replyVoice: replyVoice || "",
replyUser: replyUser || "",

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

exports.sendVoice = async (req,res)=>{

try{

const { sender, receiver } = req.body;


if(!req.file){

return res.json({
success:false,
message:"No voice file uploaded."
});

}

let voiceUrl = "";


const uploadStream =
cloudinary.uploader.upload_stream(

{
resource_type:"video",
folder:"2chat-voice"
},

(error,result)=>{

if(error){

throw error;

}

voiceUrl = result.secure_url;


Message.create({

sender,
receiver,

text:"",
image:"",

voice:voiceUrl,

voiceDuration:
Number(req.body.duration)||0,

delivered:true,

deliveredAt:new Date()

}).then(async(message)=>{


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


});


}

);


streamifier
.createReadStream(req.file.buffer)
.pipe(uploadStream);


}catch(err){

console.log(err);

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

// User
const me = await User.findOne({ username });

if(!me){

return res.json({
success:false,
message:"User not found"
});

}

// Duk users da suka taɓa yin chat
const messages = await Message.find({
$or:[
{sender:username},
{receiver:username}
]
}).sort({createdAt:-1});

const chats = {};

// Fara da friends
for(const friend of me.friends){

const user = await User.findOne({ username:friend });

if(user){

chats[friend]={
username:user.username,
avatar:user.avatar,
online:user.online,
lastSeen:user.lastSeen,
lastMessage:"",
time:null
};

}

}

// Sannan a saka latest message idan akwai
for(const msg of messages){

const otherUser =
msg.sender===username
? msg.receiver
: msg.sender;

if(!chats[otherUser]){

const user = await User.findOne({
username:otherUser
});

if(!user) continue;

chats[otherUser]={
username:user.username,
avatar:user.avatar,
online:user.online,
lastSeen:user.lastSeen,
lastMessage:"",
time:null
};

}

chats[otherUser].lastMessage =
msg.deletedForEveryone
? "🚫 Message deleted"
: msg.text
? msg.text
: msg.voice
? "🎤 Voice message"
: msg.image
? "📷 Photo"
: "Message";

chats[otherUser].time = msg.createdAt;

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


exports.deleteMessage = async(req,res)=>{

    try{

        await Message.findByIdAndDelete(req.params.id);

        res.json({
            success:true
        });

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};

exports.clearChat = async(req,res)=>{

    try{

        const {user1,user2}=req.params;

        await Message.deleteMany({
            $or:[
                {sender:user1,receiver:user2},
                {sender:user2,receiver:user1}
            ]
        });

        res.json({
            success:true
        });

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};

exports.deleteForEveryone = async (req, res) => {

    try {

        const { id } = req.params;
        const { username } = req.body;

        const message = await Message.findById(id);

        if (!message) {
            return res.json({
                success: false,
                message: "Message not found"
            });
        }

        // Sai wanda ya tura saƙon kawai zai iya gogewa
        if (message.sender !== username) {
            return res.json({
                success: false,
                message: "Permission denied"
            });
        }

        message.deletedForEveryone = true;
        message.deletedBy = username;

        await message.save();

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};
