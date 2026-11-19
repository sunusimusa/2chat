const GroupMessage = require("../models/GroupMessage");
const Group = require("../models/Group");
const Notification = require("../models/Notification");

const { sendPushNotification } = require("../services/notificationService");

const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// ==================================================
// SEND GROUP MESSAGE
// ==================================================

exports.sendMessage = async (req, res) => {

    try {

        const {
    groupId,
    text,
    voiceDuration,
    replyTo,
    replyText,
    replyImage
} = req.body;

const sender = req.user.username;


        const imageFile =
            req.files?.image?.[0];

        const voiceFile =
            req.files?.voice?.[0];


        // ==================================================
        // CHECK REQUIRED
        // ==================================================

        if (!groupId || !sender) {

            return res.status(400).json({

                success: false,

                message:
                    "Missing required fields."

            });

        }


        // ==================================================
        // CHECK GROUP
        // ==================================================

        const group =
            await Group.findById(groupId);

        if (!group) {

            return res.status(404).json({

                success: false,

                message:
                    "Group not found."

            });

        }

        const isMember =
    group.members.includes(sender) ||
    group.owner === sender;

if (!isMember) {
    return res.status(403).json({
        success: false,
        message: "You are not a member of this group."
           });
         }


        let image = "";
        let voice = "";


        // ==================================================
        // UPLOAD IMAGE
        // ==================================================

        if (imageFile) {

            const uploadResult =
                await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(

                                {
                                    resource_type:
                                        "image",

                                    folder:
                                        "2chat/group-messages"
                                },

                                (err, result) => {

                                    if (err) {

                                        reject(err);

                                    } else {

                                        resolve(result);

                                    }

                                }

                            );


                        streamifier
                            .createReadStream(
                                imageFile.buffer
                            )
                            .pipe(stream);

                    }
                );


            image =
                uploadResult.secure_url;

        }


        // ==================================================
        // UPLOAD VOICE
        // ==================================================

        if (voiceFile) {

            const uploadResult =
                await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(

                                {
                                    resource_type:
                                        "video",

                                    folder:
                                        "2chat/group-voices"
                                },

                                (err, result) => {

                                    if (err) {

                                        reject(err);

                                    } else {

                                        resolve(result);

                                    }

                                }

                            );


                        streamifier
                            .createReadStream(
                                voiceFile.buffer
                            )
                            .pipe(stream);

                    }
                );


            voice =
                uploadResult.secure_url;

        }


        // ==================================================
        // CHECK EMPTY MESSAGE
        // ==================================================

        if (

            (!text ||
                text.trim() === "") &&

            !image &&

            !voice

        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Message cannot be empty."

            });

        }


        // ==================================================
        // REPLY DATA
        // ==================================================

        let finalReplyTo = null;
        let finalReplyUser = "";
        let finalReplyText = "";
        let finalReplyImage = "";


        if (replyTo) {

    const repliedMessage =
        await GroupMessage.findOne({
            _id: replyTo,
            groupId: groupId
        });

    if (!repliedMessage) {
        return res.status(400).json({
            success: false,
            message: "Invalid reply message."
        });
    }

    finalReplyTo = repliedMessage._id;
    finalReplyUser = repliedMessage.sender;
    finalReplyText = repliedMessage.text || "";
    finalReplyImage = repliedMessage.image || "";

        }


        // ==================================================
        // CREATE MESSAGE
        // ==================================================

        const message =
            await GroupMessage.create({

                groupId,

                sender,

                text:
                    text || "",

                image,

                voice,

                voiceDuration:
                    Number(voiceDuration) || 0,

                replyTo:
                    finalReplyTo,

                replyUser:
                    finalReplyUser,

                replyText:
                    finalReplyText,

                replyImage:
                    finalReplyImage

            });


        // ==================================================
        // LAST GROUP MESSAGE
        // ==================================================

        let lastMessage =
            text || "";


        if (image) {

            lastMessage =
                "📷 Photo";

        }


        if (voice) {

            lastMessage =
                "🎤 Voice message";

        }


        if (replyTo && !text && !image && !voice) {

            lastMessage =
                "↩️ Reply";

        }


        // ==================================================
// GROUP PUSH NOTIFICATIONS
// ==================================================

const recipients = [
    ...new Set([
        ...group.members,
        group.owner
    ])
].filter(username => username !== sender);

const notificationTitle = `New message in ${group.name}`;
const notificationBody = `You have a new message from ${sender}`;

await Promise.all(
    recipients.map(async (username) => {

        try {

            await Notification.create({
                receiver: username,
                sender,
                type: "message",
                text: notificationTitle
            });

            await sendPushNotification({
                recipientUsername: username,
                title: notificationTitle,
                body: notificationBody,
                data: {
                    type: "group_message",
                    groupId: String(groupId),
                    sender
                }
            });

        } catch (error) {

            console.error(
                `GROUP NOTIFICATION ERROR (${username}):`,
                error
            );

        }

    })
);

        // ==================================================
        // RESPONSE
        // ==================================================

        return res.json({

            success: true,

            message

        });


    } catch (err) {

        console.error(
            "GROUP MESSAGE ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};



// ==================================================
// GET GROUP MESSAGES
// ==================================================

exports.getMessages = async (req, res) => {

    try {

        const group =
            await Group.findById(
                req.params.groupId
            );

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        const username = req.user.username;

        const isMember =
            group.members.includes(username) ||
            group.owner === username;

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group."
            });
        }

        const messages =
            await GroupMessage.find({


                groupId:
                    req.params.groupId

            })
            .sort({

                createdAt: 1

            });


        return res.json({

            success: true,

            messages

        });


    } catch (err) {

        console.error(
            "GET GROUP MESSAGES ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};



// ==================================================
// REACT TO GROUP MESSAGE
// ==================================================

exports.reactToMessage = async (req, res) => {

    try {

        const {
        messageId,
        emoji
    } = req.body;

const username = req.user.username;


        // ==================================================
        // CHECK REQUIRED
        // ==================================================
        
if (!messageId || !emoji) {
    return res.status(400).json({
        success: false,
        message: "messageId and emoji are required."
    });
}

// FIND MESSAGE
const message = await GroupMessage.findById(messageId);

if (!message) {
    return res.status(404).json({
        success: false,
        message: "Message not found."
    });
}


// FIND GROUP
const group = await Group.findById(message.groupId);

if (!group) {
    return res.status(404).json({
        success: false,
        message: "Group not found."
    });
}

// CHECK MEMBERSHIP
const isMember =
    group.members.includes(username) ||
    group.owner === username;

if (!isMember) {
    return res.status(403).json({
        success: false,
        message: "You are not a member of this group."
    });
}


        // ==================================================
        // ALLOWED EMOJIS
        // ==================================================

        const allowedEmojis = [

            "👍",
            "❤️",
            "😂",
            "😮",
            "😢",
            "😡"

        ];


        if (
            !allowedEmojis.includes(
                emoji
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid reaction."

            });

        }


        // ==================================================
        // FIND USER REACTION
        // ==================================================

        const existingIndex =
            message.reactions.findIndex(

                reaction =>

                    reaction.username ===
                    username

            );


        // ==================================================
        // SAME EMOJI = REMOVE
        // ==================================================

        if (

            existingIndex !== -1 &&

            message
                .reactions[
                    existingIndex
                ]
                .emoji === emoji

        ) {

            message.reactions.splice(

                existingIndex,

                1

            );

        }


        // ==================================================
        // DIFFERENT EMOJI = CHANGE
        // ==================================================

        else if (
            existingIndex !== -1
        ) {

            message
                .reactions[
                    existingIndex
                ]
                .emoji = emoji;

        }


        // ==================================================
        // NEW REACTION
        // ==================================================

        else {

            message.reactions.push({

                username,

                emoji

            });

        }


        await message.save();


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.json({

    success: true,

    message

});


    } catch (err) {

        console.error(
            "REACTION ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};

// ==================================================
// DELETE GROUP MESSAGE
// OWNER / ADMIN / MESSAGE OWNER
// ==================================================

exports.deleteMessage = async (req, res) => {

    try {

        const { messageId } = req.body;

const username = req.user.username;

if (!messageId) {
    return res.status(400).json({
        success: false,
        message: "messageId is required."
    });
}

                  
        // FIND MESSAGE
        const message =
            await GroupMessage.findById(
                messageId
            );

        if (!message) {

            return res.status(404).json({

                success: false,

                message:
                    "Message not found."

            });

        }


        // FIND GROUP
        const group =
            await Group.findById(
                message.groupId
            );

        if (!group) {

            return res.status(404).json({

                success: false,

                message:
                    "Group not found."

            });

        }

        const isMember =
    group.members.includes(username) ||
    group.owner === username;

if (!isMember) {
    return res.status(403).json({
        success: false,
        message: "You are not a member of this group."
    });
}


        // ==================================================
        // CHECK PERMISSION
        // ==================================================

        const isMessageOwner =
            message.sender === username;

        const isOwner =
            group.owner === username;

        const isAdmin =
            group.admins &&
            group.admins.includes(username);


        // ==================================================
        // ONLY MESSAGE OWNER / OWNER / ADMIN
        // ==================================================

        if (
            !isMessageOwner &&
            !isOwner &&
            !isAdmin
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You don't have permission to delete this message."

            });

        }


        // ==================================================
        // DELETE MESSAGE
        // ==================================================

        message.deleted = true;

        await message.save();


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.json({

            success: true,

            message

        });


    } catch (err) {

        console.error(
            "DELETE GROUP MESSAGE ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};

exports.editMessage = async (req, res) => {

    try {

        const {
    messageId,
    text
} = req.body;

const username = req.user.username;

if (!messageId) {
    return res.status(400).json({
        success: false,
        message: "messageId is required."
    });
} 
            
        const message =
            await GroupMessage.findById(messageId);

        if (!message) {

            return res.status(404).json({
                success: false,
                message: "Message not found."
            });

        }

        // FIND GROUP
const group = await Group.findById(message.groupId);

if (!group) {
    return res.status(404).json({
        success: false,
        message: "Group not found."
    });
}

// CHECK MEMBERSHIP
const isMember =
    group.members.includes(username) ||
    group.owner === username;

if (!isMember) {
    return res.status(403).json({
        success: false,
        message: "You are not a member of this group."
    });
}

        // Mai message kawai zai iya edit
        if (message.sender !== username) {

            return res.status(403).json({
                success: false,
                message: "You can only edit your own message."
            });

        }

        // Ba za a edit deleted message ba
        if (message.deleted) {

            return res.status(400).json({
                success: false,
                message: "Deleted message cannot be edited."
            });

        }

        if (!text || text.trim() === "") {

            return res.status(400).json({
                success: false,
                message: "Message cannot be empty."
            });

        }

        message.text = text.trim();
        message.edited = true;

        await message.save();

        return res.json({

            success: true,
            message

        });

    } catch (err) {

        console.error(
            "EDIT MESSAGE ERROR:",
            err
        );

        return res.status(500).json({

            success: false,
            message: err.message

        });

    }

};

// ==================================================
// MARK GROUP MESSAGE AS SEEN
// ==================================================

exports.markMessageAsSeen = async (req, res) => {

    try {

        const { messageId } = req.body;

       const username = req.user.username;

        // ==================================================
        // CHECK REQUIRED
        // ==================================================
        
        if (!messageId) {
           return res.status(400).json({
                success: false,
                message: "messageId is required."
            });
        }         

        // ==================================================
        // FIND MESSAGE
        // ==================================================

        const message =
            await GroupMessage.findById(messageId);


        if (!message) {

            return res.status(404).json({

                success: false,

                message:
                    "Message not found."

            });

        }

        // FIND GROUP
const group = await Group.findById(message.groupId);

if (!group) {
    return res.status(404).json({
        success: false,
        message: "Group not found."
    });
}

// CHECK MEMBERSHIP
const isMember =
    group.members.includes(username) ||
    group.owner === username;

if (!isMember) {
    return res.status(403).json({
        success: false,
        message: "You are not a member of this group."
    });
    }
        

        // ==================================================
        // DON'T COUNT MESSAGE OWNER
        // ==================================================

        if (message.sender === username) {

            return res.json({

                success: true,

                message

            });

        }


        // ==================================================
        // CHECK IF ALREADY SEEN
        // ==================================================

        const alreadySeen =
            message.seenBy.some(

                seen =>
                    seen.username === username

            );


        // ==================================================
        // ADD USER TO SEEN BY
        // ==================================================

        if (!alreadySeen) {

            message.seenBy.push({

                username,

                seenAt: new Date()

            });

            await message.save();

        }


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.json({

            success: true,

            message

        });


    } catch (err) {

        console.error(
            "MARK MESSAGE SEEN ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};

// ==================================================
// PIN GROUP MESSAGE
// ==================================================

exports.pinMessage = async (req, res) => {

    try {

        const { messageId } = req.body;

const username = req.user.username;

if (!messageId) {
    return res.status(400).json({
        success: false,
        message: "messageId is required."
    });
}
        
            
        // FIND MESSAGE
        const message =
            await GroupMessage.findById(messageId);

        if (!message) {

            return res.status(404).json({

                success: false,

                message: "Message not found."

            });

        }

        // FIND GROUP
        const group =
            await Group.findById(message.groupId);

        if (!group) {

            return res.status(404).json({

                success: false,

                message: "Group not found."

            });

        }

        const isMember =
    group.members.includes(username) ||
    group.owner === username;

if (!isMember) {
    return res.status(403).json({
        success: false,
        message: "You are not a member of this group."
    });
}

        // ==================================================
        // OWNER / ADMIN ONLY
        // ==================================================

        const isOwner =
            group.owner === username;

        const isAdmin =
            group.admins &&
            group.admins.includes(username);

        if (!isOwner && !isAdmin) {

            return res.status(403).json({

                success: false,

                message:
                    "Only group owner or admin can pin messages."

            });

        }

        // ==================================================
        // PIN MESSAGE
        // ==================================================

        message.pinned = true;

        message.pinnedBy = username;

        message.pinnedAt = new Date();

        await message.save();

        return res.json({

            success: true,

            message

        });

    } catch (err) {

        console.error(
            "PIN MESSAGE ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};


// ==================================================
// UNPIN GROUP MESSAGE
// ==================================================

exports.unpinMessage = async (req, res) => {

    try {

        const { messageId } = req.body;

const username = req.user.username;

if (!messageId) {
    return res.status(400).json({
        success: false,
        message: "messageId is required."
    });
}
            

        // FIND MESSAGE
        const message =
            await GroupMessage.findById(messageId);

        if (!message) {

            return res.status(404).json({

                success: false,

                message: "Message not found."

            });

        }

        // FIND GROUP
        const group =
            await Group.findById(message.groupId);

        if (!group) {

            return res.status(404).json({

                success: false,

                message: "Group not found."

            });

        }

        const isMember =
    group.members.includes(username) ||
    group.owner === username;

if (!isMember) {
    return res.status(403).json({
        success: false,
        message: "You are not a member of this group."
    });
}

        // ==================================================
        // OWNER / ADMIN ONLY
        // ==================================================

        const isOwner =
            group.owner === username;

        const isAdmin =
            group.admins &&
            group.admins.includes(username);

        if (!isOwner && !isAdmin) {

            return res.status(403).json({

                success: false,

                message:
                    "Only group owner or admin can unpin messages."

            });

        }

        // ==================================================
        // UNPIN
        // ==================================================

        message.pinned = false;

        message.pinnedBy = "";
        
        message.pinnedAt = null;

        await message.save();

        return res.json({

            success: true,

            message

        });

    } catch (err) {

        console.error(
            "UNPIN MESSAGE ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};
