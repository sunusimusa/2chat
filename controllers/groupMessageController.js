const GroupMessage = require("../models/GroupMessage");
const Group = require("../models/Group");

// ================= SEND GROUP MESSAGE =================

exports.sendMessage = async (req, res) => {

    try{

        const {

            groupId,

            sender,

            text

        } = req.body;

        if(!groupId || !sender){

            return res.json({

                success:false,

                message:"Missing required fields."

            });

        }

        if(!text || text.trim()===""){

            return res.json({

                success:false,

                message:"Message cannot be empty."

            });

        }

        const message = await GroupMessage.create({

            groupId,

            sender,

            text

        });

        await Group.findByIdAndUpdate(

            groupId,

            {

                lastMessage:text,

                lastMessageSender:sender,

                lastMessageTime:new Date()

            }

        );

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

// ================= LOAD GROUP MESSAGES =================

exports.getMessages = async (req, res) => {

    try{

        const messages = await GroupMessage.find({

            groupId:req.params.groupId

        })

        .sort({

            createdAt:1

        });

        res.json({

            success:true,

            messages

        });

    }catch(err){

        console.error(err);

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};
