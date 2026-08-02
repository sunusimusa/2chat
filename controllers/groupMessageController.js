const GroupMessage = require("../models/GroupMessage");
const Group = require("../models/Group");

const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");


// ==================================================
// SEND GROUP MESSAGE
// ==================================================

exports.sendMessage = async (req, res) => {

    try {

        const {
            groupId,
            sender,
            text,
            voiceDuration,
            replyTo,
            replyUser,
            replyText,
            replyImage
        } = req.body;


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

            finalReplyTo = replyTo;

            finalReplyUser =
                replyUser || "";

            finalReplyText =
                replyText || "";

            finalReplyImage =
                replyImage || "";

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


        await Group.findByIdAndUpdate(

            groupId,

            {

                lastMessage,

                lastMessageSender:
                    sender,

                lastMessageTime:
                    new Date()

            }

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
            username,
            emoji
        } = req.body;


        // ==================================================
        // CHECK REQUIRED
        // ==================================================

        if (
            !messageId ||
            !username ||
            !emoji
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "messageId, username and emoji are required."

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
        // FIND MESSAGE
        // ==================================================

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

exports.deleteMessage = async (req, res) => {

    try {

        const {
            messageId,
            username
        } = req.body;

        if(!messageId || !username){

            return res.status(400).json({

                success:false,
                message:"messageId and username are required."

            });

        }

        const message =
            await GroupMessage.findById(messageId);

        if(!message){

            return res.status(404).json({

                success:false,
                message:"Message not found."

            });

        }

        // Only message owner can delete
        if(message.sender !== username){

            return res.status(403).json({

                success:false,
                message:"You can only delete your own message."

            });

        }

        message.deleted = true;

        await message.save();

        return res.json({

            success:true,

            message

        });

    }catch(err){

        console.error(
            "DELETE GROUP MESSAGE ERROR:",
            err
        );

        return res.status(500).json({

            success:false,

            message:err.message

        });

    }

};
