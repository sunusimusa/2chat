const Group = require("../models/Group");
const User = require("../models/User");

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

    avatar: avatar || "/images/default-group.png",

    cover: "/images/default-group-cover.jpg",

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

// ================= ADD MEMBER =================
exports.addMember = async (req, res) => {

    try{

        const {
            groupId,
            username,
            member
        } = req.body;

        const group = await Group.findById(groupId);

        if(!group){

            return res.json({
                success:false,
                message:"Group not found."
            });

        }

        // Owner ko Admin ne kawai zai iya ƙara member
        if(
            group.owner !== username &&
            !group.admins.includes(username)
        ){

            return res.json({
                success:false,
                message:"Only owner or admins can add members."
            });

        }

        // Check if user exists
const userExists = await User.findOne({

    username:member

});

if(!userExists){

    return res.json({

        success:false,

        message:"User not found."

    });

}

        if(group.members.includes(member)){

            return res.json({
                success:false,
                message:"User is already in this group."
            });

        }

        group.members.push(member);
        group.memberCount = group.members.length;

        await group.save();

        res.json({
            success:true,
            message:"Member added successfully.",
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

// ==================================================
// PROMOTE MEMBER TO ADMIN
// ==================================================

exports.promoteToAdmin = async (req, res) => {

    try {

        const {
            groupId,
            username,
            member
        } = req.body;


        // CHECK REQUIRED
        if (!groupId || !username || !member) {

            return res.status(400).json({

                success: false,

                message:
                    "groupId, username and member are required."

            });

        }


        // FIND GROUP
        const group =
            await Group.findById(groupId);

        if (!group) {

            return res.status(404).json({

                success: false,

                message:
                    "Group not found."

            });

        }


        // ONLY OWNER CAN PROMOTE ADMIN
        if (group.owner !== username) {

            return res.status(403).json({

                success: false,

                message:
                    "Only the group owner can promote admins."

            });

        }


        // CHECK MEMBER EXISTS IN GROUP
        if (!group.members.includes(member)) {

            return res.status(400).json({

                success: false,

                message:
                    "This user is not a member of the group."

            });

        }


        // OWNER IS ALREADY OWNER
        if (group.owner === member) {

            return res.status(400).json({

                success: false,

                message:
                    "Group owner is already the owner."

            });

        }


        // ALREADY ADMIN
        if (group.admins.includes(member)) {

            return res.status(400).json({

                success: false,

                message:
                    "This user is already an admin."

            });

        }


        // ADD ADMIN
        group.admins.push(member);

        await group.save();


        return res.json({

            success: true,

            message:
                "Member promoted to admin successfully.",

            group

        });

    } catch (err) {

        console.error(
            "PROMOTE ADMIN ERROR:",
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
// REMOVE ADMIN
// ==================================================

exports.removeAdmin = async (req, res) => {

    try {

        const {
            groupId,
            username,
            member
        } = req.body;


        // CHECK REQUIRED
        if (!groupId || !username || !member) {

            return res.status(400).json({

                success: false,

                message:
                    "groupId, username and member are required."

            });

        }


        // FIND GROUP
        const group =
            await Group.findById(groupId);

        if (!group) {

            return res.status(404).json({

                success: false,

                message:
                    "Group not found."

            });

        }


        // ONLY OWNER CAN REMOVE ADMIN
        if (group.owner !== username) {

            return res.status(403).json({

                success: false,

                message:
                    "Only the group owner can remove admins."

            });

        }


        // CANNOT REMOVE OWNER
        if (group.owner === member) {

            return res.status(400).json({

                success: false,

                message:
                    "The group owner cannot be removed as admin."

            });

        }


        // CHECK ADMIN
        if (!group.admins.includes(member)) {

            return res.status(400).json({

                success: false,

                message:
                    "This user is not an admin."

            });

        }


        // REMOVE ADMIN
        group.admins =
            group.admins.filter(
                admin => admin !== member
            );

        await group.save();


        return res.json({

            success: true,

            message:
                "Admin removed successfully.",

            group

        });

    } catch (err) {

        console.error(
            "REMOVE ADMIN ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};
