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

// Tabbatar sender da receiver suna nan
if(!sender || !receiver){

return res.json({
success:false,
message:"Sender or receiver missing."
});

}

let image = "";

// Upload image idan akwai
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

// Kada a aika message mara text kuma babu image
if((!text || text.trim() === "") && !image){

return res.json({
success:false,
message:"Message cannot be empty."
});

}

const message = await Message.create({

sender,
receiver,

text: text || "",
image,

replyTo: replyTo || null,
replyText: replyText || "",
replyImage: replyImage || "",
replyVoice: replyVoice || "",
replyUser: replyUser || "",

reactions: [],

delivered:true,
deliveredAt:new Date()

});

await Notification.create({

receiver,
sender,
type:"message",
text:`${sender} sent you a message 📨`

});

return res.json({

success:true,
message

});

}catch(err){

console.error(err);

return res.status(500).json({

success:false,
message:err.message

});

}

};

// ================= SEND VOICE =================
exports.sendVoice = async (req, res) => {

try{

const { sender, receiver } = req.body;

if(!sender || !receiver){

return res.json({
success:false,
message:"Sender or receiver missing."
});

}

if(!req.file){

return res.json({
success:false,
message:"No voice file uploaded."
});

}

const uploadStream = cloudinary.uploader.upload_stream(

{
resource_type:"video",
folder:"2chat-voice"
},

async(error, result)=>{

if(error){

console.log(error);

return res.status(500).json({
success:false,
message:"Voice upload failed."
});

}

try{

const message = await Message.create({

sender,
receiver,

text:"",
image:"",
voice:result.secure_url,

voiceDuration:Number(req.body.duration) || 0,

delivered:true,
deliveredAt:new Date()

});

await Notification.create({

receiver,
sender,
type:"message",
text:`${sender} sent you a voice message 🎤`

});

return res.json({

success:true,
message

});

}catch(err){

console.log(err);

return res.status(500).json({

success:false,
message:err.message

});

}

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

exports.getMessages = async (req, res) => {

try{

const { sender, receiver } = req.query;

if(!sender || !receiver){

return res.status(400).json({
success:false,
message:"Sender and receiver are required."
});

}

const messages = await Message.find({

$or:[
{ sender, receiver },
{ sender:receiver, receiver:sender }
]

})
.sort({ createdAt:1 })
.lean();

await Message.updateMany(

{
sender:receiver,
receiver:sender,
seen:false
},

{
$set:{
seen:true,
seenAt:new Date()
}
}

);

return res.json({

success:true,
messages

});

}catch(err){

console.error(err);

return res.status(500).json({

success:false,
message:"Failed to load messages."

});
  
// ================= CHAT LIST =================
exports.getChats = async (req, res) => {

try {

const { username } = req.params;

// User
const me = await User.findOne({ username });

if (!me) {
return res.json({
success: false,
message: "User not found"
});
}

// Duk messages
const messages = await Message.find({
$or: [
{ sender: username },
{ receiver: username }
]
}).sort({ createdAt: -1 });

const chats = {};

for (const friend of me.friends || []) {

const user = await User.findOne({ username: friend });

if (!user) continue;

chats[friend] = {
username: user.username,
avatar: user.avatar || "/images/default.png",
online: user.online || false,
lastSeen: user.lastSeen || null,
lastMessage: "",
time: null
};

}

// Latest messages
for (const msg of messages) {

const otherUser =
msg.sender === username
? msg.receiver
: msg.sender;

// Idan babu user a chats
if (!chats[otherUser]) {

const user = await User.findOne({
username: otherUser
});

if (!user) continue;

// Idan hidden chat ne kuma sabon message ya shigo
if (
Array.isArray(user.hiddenChats) &&
user.hiddenChats.includes(username)
) {

user.hiddenChats =
user.hiddenChats.filter(
u => u !== username
);

await user.save();

}

chats[otherUser] = {
username: user.username,
avatar: user.avatar || "/images/default.png",
online: user.online || false,
lastSeen: user.lastSeen || null,
lastMessage: "",
time: null
};

}

// Kada a sake overwrite idan an riga an saka latest message
if (chats[otherUser].time) continue;

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
success: true,
chats: Object.values(chats)
});

} catch (err) {

console.error(err);

res.status(500).json({
success: false,
message: err.message
});

}

};


// ================= REACTION =================

exports.reactMessage = async (req, res) => {

    try {

        const { messageId, username, emoji } = req.body;

        if (!messageId || !username || !emoji) {
            return res.json({
                success: false,
                message: "Missing required fields."
            });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.json({
                success: false,
                message: "Message not found."
            });
        }

        // Tabbatar reactions array tana nan
        if (!Array.isArray(message.reactions)) {
            message.reactions = [];
        }

        const oldReaction = message.reactions.find(
            r => r.username === username
        );

        if (oldReaction) {

            // Canza emoji idan ya taba react
            oldReaction.emoji = emoji;

        } else {

            // Sabon reaction
            message.reactions.push({
                username,
                emoji
            });

        }

        await message.save();

        res.json({
            success: true,
            message
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.deleteMessage = async (req, res) => {

    try {

        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.json({
                success: false,
                message: "Message not found."
            });
        }

        // Mai message kaɗai zai iya gogewa
        if (message.sender !== req.body.username) {
            return res.json({
                success: false,
                message: "Permission denied."
            });
        }

        await Message.findByIdAndDelete(req.params.id);

        return res.json({
            success: true,
            message: "Message deleted successfully."
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};
  
exports.clearChat = async (req, res) => {

    try {

        const { user1, user2 } = req.params;

        if (!user1 || !user2) {

            return res.json({
                success: false,
                message: "Missing users."
            });

        }

        const result = await Message.deleteMany({
            $or: [
                { sender: user1, receiver: user2 },
                { sender: user2, receiver: user1 }
            ]
        });

        return res.json({
            success: true,
            deletedCount: result.deletedCount,
            message: "Chat cleared successfully."
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.deleteForEveryone = async (req, res) => {

    try {

        const { id } = req.params;
        const { username } = req.body;

        if (!id || !username) {

            return res.json({
                success: false,
                message: "Missing data."
            });

        }

        const message = await Message.findById(id);

        if (!message) {

            return res.json({
                success: false,
                message: "Message not found."
            });

        }

        // Mai tura message kaɗai zai iya gogewa
        if (message.sender !== username) {

            return res.json({
                success: false,
                message: "Permission denied."
            });

        }

        // Idan an riga an goge shi
        if (message.deletedForEveryone) {

            return res.json({
                success: false,
                message: "Message already deleted."
            });

        }

        message.deletedForEveryone = true;
        message.deletedBy = username;
        message.text = "";
        message.image = "";
        message.voice = "";

        await message.save();

        return res.json({
            success: true,
            message: "Message deleted for everyone."
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};
