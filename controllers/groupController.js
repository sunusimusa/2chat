const Group = require("../models/Group");

// ================= CREATE GROUP =================
exports.createGroup = async (req, res) => {

    try{

        const {
            name,
            description,
            owner,
            avatar
        } = req.body;

        if(!name || !owner){

            return res.json({
                success:false,
                message:"Group name and owner are required."
            });

        }

        const group = await Group.create({

    name,

    description: description || "",

    avatar: avatar || "",

    cover:"",

    owner,

    admins:[owner],

    members:[owner],

    memberCount:1,

    privacy:"public",

    lastMessage:"",

    lastMessageSender:"",

    lastMessageTime:null

});

        res.json({
            success:true,
            group
        });

    }catch(err){

        console.error(err);

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};

// ================= GET ALL GROUPS =================
exports.getGroups = async (req, res) => {

    try{

        const groups = await Group.find()
        .sort({
            lastMessageTime:-1,
            createdAt:-1
        })
        .lean();

        groups.forEach(group=>{

            group.memberCount =
            group.members.length;

        });

        res.json({

            success:true,

            groups

        });

    }catch(err){

        console.error(err);

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

// ================= GET SINGLE GROUP =================
exports.getGroup = async (req, res) => {

    try{

        const group = await Group.findById(req.params.id);

        if(!group){

            return res.json({
                success:false,
                message:"Group not found."
            });

        }

        res.json({
            success:true,
            group
        });

    }catch(err){

        console.error(err);

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};

// ================= JOIN GROUP =================
exports.joinGroup = async (req, res) => {

    try{

        const {
            groupId,
            username
        } = req.body;

        const group = await Group.findById(groupId);

        if(!group){

            return res.json({
                success:false,
                message:"Group not found."
            });

        }

        if(!group.members.includes(username)){

    group.members.push(username);

    group.memberCount = group.members.length;

    await group.save();

}

        res.json({
            success:true,
            group
        });

    }catch(err){

        console.error(err);

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};

// ================= LEAVE GROUP =================
exports.leaveGroup = async (req, res) => {

    try{

        const {
            groupId,
            username
        } = req.body;

        const group = await Group.findById(groupId);

        if(!group){

            return res.json({
                success:false,
                message:"Group not found."
            });

        }

        group.members = group.members.filter(
    m => m !== username
);

group.memberCount = group.members.length;

await group.save();
        
        res.json({
            success:true
        });

    }catch(err){

        console.error(err);

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};

// ================= DELETE GROUP =================
exports.deleteGroup = async (req, res) => {

    try{

        const {
            groupId,
            username
        } = req.body;

        const group = await Group.findById(groupId);

        if(!group){

            return res.json({
                success:false,
                message:"Group not found."
            });

        }

        if(group.owner !== username){

            return res.json({
                success:false,
                message:"Only the group owner can delete this group."
            });

        }

        await Group.findByIdAndDelete(groupId);

        res.json({
            success:true,
            message:"Group deleted successfully."
        });

    }catch(err){

        console.error(err);

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};
