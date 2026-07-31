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
        
        if(!groupId || !sender){

            return res.json({
                success:false,
                message:"Missing required fields."
            });

        }

        let image = "";

        if(req.file){

            const uploadResult = await new Promise((resolve,reject)=>{

                const stream =
                cloudinary.uploader.upload_stream(

                    {
                        folder:"2chat/groups"
                    },

                    (err,result)=>{

                        if(err) reject(err);

                        else resolve(result);

                    }

                );

                streamifier
                .createReadStream(req.file.buffer)
                .pipe(stream);

            });

            image = uploadResult.secure_url;

        }

        if((!text || text.trim()==="") && image===""){

            return res.json({

                success:false,

                message:"Message cannot be empty."

            });

        }

        let image = "";
let voice = "";

if(req.file){

    const uploadResult = await new Promise((resolve,reject)=>{

        const stream = cloudinary.uploader.upload_stream(

            {
                resource_type:"auto",
                folder:"2chat/group-messages"
            },

            (err,result)=>{

                if(err) reject(err);

                else resolve(result);

            }

        );

        streamifier
        .createReadStream(req.file.buffer)
        .pipe(stream);

    });

    if(req.file.mimetype.startsWith("image/")){

        image = uploadResult.secure_url;

    }

    if(req.file.mimetype.startsWith("audio/")){

        voice = uploadResult.secure_url;

    }

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

                lastMessage:image ? "📷 Photo" : text,

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
