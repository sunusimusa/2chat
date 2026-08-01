const GroupMessage = require("../models/GroupMessage");
const Group = require("../models/Group");

const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// ================= SEND GROUP MESSAGE =================

exports.sendMessage = async (req, res) => {

    try{

        const {
    groupId,
    sender,
    text,
    voiceDuration
} = req.body;

const imageFile = req.files?.image?.[0];
const voiceFile = req.files?.voice?.[0];
        
        if(!groupId || !sender){

            return res.json({
                success:false,
                message:"Missing required fields."
            });

        }

        
let image = "";
let voice = "";

if(file){

    const uploadResult = await new Promise((resolve,reject)=>{

        const stream = cloudinary.uploader.upload_stream(

            {
                resource_type: "auto",
                folder: "2chat/group-messages"
            },

            (err,result)=>{

                if(err) reject(err);
                else resolve(result);

            }

        );

        streamifier
        .createReadStream(file.buffer)
        .pipe(stream);

    });

    if(file.mimetype.startsWith("image/")){

        image = uploadResult.secure_url;

    }

    if(file.mimetype.startsWith("audio/")){

        voice = uploadResult.secure_url;

    }

}

if((!text || text.trim()==="") && image==="" && voice===""){

    return res.json({

        success:false,

        message:"Message cannot be empty."

    });

}
        

        const message = await GroupMessage.create({

    groupId,

    sender,

    text,

    image,

    voice,

    voiceDuration:
    voiceDuration || 0

});
        
        await Group.findByIdAndUpdate(

            groupId,

            {

                lastMessage:

voice ? "🎤 Voice Message"

: image ? "📷 Photo"

: text,
                
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
