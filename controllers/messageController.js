const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");
const Notification = require("../models/Notification");
const User = require("../models/User");

// =========================================
// CHECK BLOCK STATUS
// =========================================

const isBlockedBetweenUsers = async (user1, user2) => {

    const [firstUser, secondUser] = await Promise.all([

        User.findOne({ username: user1 })
            .select("blockedUsers"),

        User.findOne({ username: user2 })
            .select("blockedUsers")

    ]);

    if (!firstUser || !secondUser) {
        return true;
    }

    const firstBlockedSecond =
        (firstUser.blockedUsers || []).some(
            id => String(id) === String(secondUser._id)
        );

    const secondBlockedFirst =
        (secondUser.blockedUsers || []).some(
            id => String(id) === String(firstUser._id)
        );

    return firstBlockedSecond || secondBlockedFirst;

};

const streamifier = require("streamifier");
const { sendPushNotification } = require("../services/notificationService");

// ================= SEND MESSAGE =================
exports.sendMessage = async (req, res) => {

try{

const {
receiver,
text,
replyTo,
replyText,
replyImage,
replyVoice,
replyUser
} = req.body;

const sender = req.user.username;
  
if(!sender || !receiver){

return res.status(400).json({
success:false,
message:"Sender or receiver missing."
});

}

  const receiverUser = await User.findOne({
    username: receiver
});

if (!receiverUser) {
    return res.status(404).json({
        success: false,
        message: "Receiver account not found."
    });
}

// =========================================
// BLOCK PROTECTION
// =========================================

const blocked = await isBlockedBetweenUsers(
    sender,
    receiver
);

if (blocked) {
    return res.status(403).json({
        success: false,
        blocked: true,
        message: "You cannot send messages to this user."
    });
}    

let image = "";

if(req.file){

const uploadStream = cloudinary.uploader.upload_stream(

{
resource_type:"image",
folder:"2chat-images"
},

async(error,result)=>{

if(error){

return res.status(500).json({
success:false,
message:"Image upload failed."
});

}

image = result.secure_url;

if((!text || text.trim()==="") && !image){

return res.json({
success:false,
message:"Message cannot be empty."
});

}

const message = await Message.create({

sender,
receiver,

text:text || "",
image,
type: image ? "image" : "text",
  
replyTo:replyTo || null,
replyText:replyText || "",
replyImage:replyImage || "",
replyVoice:replyVoice || "",
replyUser:replyUser || "",

reactions:[],

delivered:true,
deliveredAt:new Date()

});

await Notification.create({

receiver,
sender,
type:"message",
text:`${sender} sent you a message 📨`

});

sendPushNotification({
    recipientUsername: receiver,
    title: sender,
    body: `${sender} sent you a photo 📷`,
    data: { type: "message", sender, receiver }
}).catch(err => console.error("Image push error:", err));

return res.json({

success:true,
message

});

}

);

streamifier
.createReadStream(req.file.buffer)
.pipe(uploadStream);

return;

}

if((!text || text.trim()==="") && !image){

return res.json({
success:false,
message:"Message cannot be empty."
});

}

const message = await Message.create({

sender,
receiver,

text:text || "",
image,
type: image ? "image" : "text",
  
replyTo:replyTo || null,
replyText:replyText || "",
replyImage:replyImage || "",
replyVoice:replyVoice || "",
replyUser:replyUser || "",

reactions:[],

delivered:true,
deliveredAt:new Date()

});

await Notification.create({

receiver,
sender,
type:"message",
text:`${sender} sent you a message 📨`

});

sendPushNotification({
    recipientUsername: receiver,
    title: sender,
    body: `${sender} sent you a message 📨`,
    data: { type: "message", sender, receiver }
}).catch(err => console.error("Chat push error:", err));

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

const { receiver } = req.body;

const sender = req.user.username;
  
if(!sender || !receiver){

return res.status(400).json({
success:false,
message:"Sender or receiver missing."
});

}

  const receiverUser = await User.findOne({
    username: receiver
});

if (!receiverUser) {
    return res.status(404).json({
        success: false,
        message: "Receiver account not found."
    });
} 

// =========================================
// BLOCK PROTECTION
// =========================================

const blocked = await isBlockedBetweenUsers(
    sender,
    receiver
);

if (blocked) {
    return res.status(403).json({
        success: false,
        blocked: true,
        message: "You cannot send voice messages to this user."
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
type:"voice",

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

sendPushNotification({
    recipientUsername: receiver,
    title: sender,
    body: `${sender} sent you a voice message 🎤`,
    data: { type: "message", sender, receiver }
}).catch(err => console.error("Voice push error:", err));

return res.json({

success:true,
message

});

}catch(err){

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

    try {

        const { receiver } = req.query;
        const sender = req.user.username;

        if (!receiver) {
            return res.status(400).json({
                success: false,
                message: "Receiver is required."
            });
        }

        if (sender === receiver) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiver."
            });
        }

        // =========================================
// BLOCK PROTECTION
// =========================================

const blocked = await isBlockedBetweenUsers(
    sender,
    receiver
);

if (blocked) {
    return res.status(403).json({
        success: false,
        blocked: true,
        message: "You cannot access this conversation."
    });
}

        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { sender, receiver },
                        { sender: receiver, receiver: sender }
                    ]
                },
                {
                    deletedForMe: { $ne: sender }
                }
            ]
        })
        .sort({ createdAt: 1 })
        .lean();

        await Message.updateMany(
            {
                sender: receiver,
                receiver: sender,
                seen: false,
                deletedForMe: { $ne: sender }
            },
            {
                $set: {
                    seen: true,
                    seenAt: new Date()
                }
            }
        );

        return res.json({
            success: true,
            messages
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Failed to load messages."
        });

    }

};
  
// ================= CHAT LIST =================
exports.getChats = async (req, res) => {

try {

const username = req.user.username;
  
// User
const me = await User.findOne({ username });

if (!me) {
return res.json({
success: false,
message: "User not found"
});
}

// =========================================
// GET USERS WHO BLOCKED ME
// =========================================

const blockedMe = await User.distinct(
    "_id",
    { blockedUsers: me._id }
);

const blockedIds = new Set([
    String(me._id),
    ...(me.blockedUsers || []).map(id => String(id)),
    ...blockedMe.map(id => String(id))
]);

// Convert blocked IDs to usernames
const blockedUsers = await User.find({
    _id: { $in: Array.from(blockedIds) }
}).select("username");

const blockedUsernames = new Set(
    blockedUsers.map(user => user.username)
);    

// Duk messages
const messages = await Message.find({
    $and: [
        {
            $or: [
                { sender: username },
                { receiver: username }
            ]
        },
        {
            deletedForMe: { $ne: username }
        }
    ]
}).sort({ createdAt: -1 });
  
const chats = {};

for (const friend of me.friends || []) {
    
if (blockedUsernames.has(friend)) continue;

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

if (blockedUsernames.has(otherUser)) continue;    

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

        const { messageId, emoji } = req.body;
        const username = req.user.username;

        if (!messageId || !emoji) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields."
            });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found."
            });
        }

      // Only chat participants can react
if (
    message.sender !== username &&
    message.receiver !== username
) {
    return res.status(403).json({
        success: false,
        message: "You are not allowed to react to this message."
    });
}

// =========================================
// BLOCK PROTECTION
// =========================================

const otherUser =
    message.sender === username
        ? message.receiver
        : message.sender;

const blocked = await isBlockedBetweenUsers(
    username,
    otherUser
);

if (blocked) {
    return res.status(403).json({
        success: false,
        blocked: true,
        message: "You cannot react to messages from this user."
    });
}        

// Do not allow reactions on deleted messages
if (
    message.deletedForEveryone ||
    message.deletedForMe.includes(username)
) {
    return res.status(403).json({
        success: false,
        message: "You cannot react to a deleted message."
    });
}


        if (!Array.isArray(message.reactions)) {
            message.reactions = [];
        }

        const oldReaction = message.reactions.find(
            r => r.username === username
        );

        if (oldReaction) {
            oldReaction.emoji = emoji;
        } else {
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

        const username = req.user.username;

        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found."
            });
        }

        // Sender ko receiver kawai zai iya ɓoye message
        if (
            message.sender !== username &&
            message.receiver !== username
        ) {
            return res.status(403).json({
                success: false,
                message: "Permission denied."
            });
        }

        // Kada a maimaita username idan an riga an ɓoye message
        if (!message.deletedForMe.includes(username)) {

            message.deletedForMe.push(username);

            await message.save();

        }

        return res.json({
            success: true,
            message: "Message deleted for you."
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Failed to delete message."
        });

    }

};

exports.clearChat = async (req, res) => {

    try {

        const user1 = req.user.username;
        const { user2 } = req.params;

        if (!user1 || !user2) {
            return res.status(400).json({
                success: false,
                message: "Missing users."
            });
        }

        if (user1 === user2) {
            return res.status(400).json({
                success: false,
                message: "Invalid chat users."
            });
        }

        // =========================================
// VALIDATE CHAT PARTICIPANT
// =========================================

const otherUser = await User.findOne({
    username: user2
});

if (!otherUser) {
    return res.status(404).json({
        success: false,
        message: "Chat user not found."
    });
}

        const result = await Message.updateMany(
            {
                $or: [
                    { sender: user1, receiver: user2 },
                    { sender: user2, receiver: user1 }
                ],
                deletedForMe: { $ne: user1 }
            },
            {
                $addToSet: {
                    deletedForMe: user1
                }
            }
        );

        return res.json({
            success: true,
            deletedCount: result.modifiedCount,
            message: "Chat cleared successfully."
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Failed to clear chat."
        });

    }

};

exports.deleteForEveryone = async (req, res) => {

    try {

        const { id } = req.params;
        const username = req.user.username;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Missing message ID."
            });
        }

        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found."
            });
        }

        // Sender kaɗai zai iya gogewa
        if (message.sender !== username) {
            return res.status(403).json({
                success: false,
                message: "Permission denied."
            });
        }

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

        message.file = "";
        message.fileName = "";
        message.fileSize = 0;
      
        message.replyTo = null;
        message.replyText = "";
        message.replyImage = "";
        message.replyVoice = "";
        message.replyUser = "";

        message.reactions = [];

        await message.save();

        return res.json({
            success: true,
            message: "Message deleted for everyone."
        });

    } catch (err) {

        console.error("Delete For Everyone Error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

