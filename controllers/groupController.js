const Group = require("../models/Group");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const GroupInvitation =
    require("../models/GroupInvitation");

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
// ================= JOIN GROUP =================
exports.joinGroup = async (req, res) => {

    try {

        const {
            groupId,
            username
        } = req.body;


        // ==========================
        // CHECK REQUIRED DATA
        // ==========================

        if (!groupId || !username) {

            return res.status(400).json({

                success: false,

                message:
                    "Group ID and username are required."

            });

        }


        // ==========================
        // FIND GROUP
        // ==========================

        const group =
            await Group.findById(groupId);

        if (!group) {

            return res.status(404).json({

                success: false,

                message:
                    "Group not found."

            });

        }


        // ==========================
        // CHECK ALREADY MEMBER
        // ==========================

        if (group.members.includes(username)) {

            return res.json({

                success: true,

                message:
                    "You are already a member of this group.",

                group

            });

        }


        // ==========================
        // PRIVATE GROUP
        // ==========================

        if (group.privacy === "private") {

            return res.status(403).json({

                success: false,

                private: true,

                message:
                    "This is a private group. You need an invitation to join."

            });

        }


        // ==========================
        // PUBLIC GROUP
        // ==========================

        group.members.push(username);

        group.memberCount =
            group.members.length;


        await group.save();


        // ==========================
        // SUCCESS
        // ==========================

        return res.json({

            success: true,

            private: false,

            message:
                "You joined the group successfully.",

            group

        });


    } catch (error) {

        console.error(
            "JOIN GROUP ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to join group."

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

// ==================================================
// UPDATE GROUP SETTINGS
// ==================================================

exports.updateGroupSettings = async (req, res) => {

    try {

        const {
            groupId,
            username,
            name,
            description,
            privacy
        } = req.body;


        // ==========================
        // CHECK REQUIRED DATA
        // ==========================

        if (!groupId || !username) {

            return res.status(400).json({

                success: false,

                message:
                    "Group ID and username are required."

            });

        }


        // ==========================
        // FIND GROUP
        // ==========================

        const group =
            await Group.findById(groupId);

        if (!group) {

            return res.status(404).json({

                success: false,

                message:
                    "Group not found."

            });

        }


        // ==========================
        // OWNER ONLY
        // ==========================

        if (group.owner !== username) {

            return res.status(403).json({

                success: false,

                message:
                    "Only the group owner can change settings."

            });

        }


        // ==========================
        // UPDATE NAME
        // ==========================

        if (
            typeof name === "string" &&
            name.trim() !== ""
        ) {

            group.name =
                name.trim();

        }


        // ==========================
        // UPDATE DESCRIPTION
        // ==========================

        if (
            typeof description === "string"
        ) {

            group.description =
                description.trim();

        }


        // ==========================
        // AVATAR UPLOAD
        // ==========================

        if (
            req.files &&
            req.files.avatar &&
            req.files.avatar[0]
        ) {

            const file =
                req.files.avatar[0];

            const result =
                await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(

                                {
                                    folder:
                                        "2chat/groups/avatars",

                                    resource_type:
                                        "image"
                                },

                                (error, result) => {

                                    if(error){

                                        reject(error);

                                    }else{

                                        resolve(result);

                                    }

                                }

                            );

                        stream.end(
                            file.buffer
                        );

                    }
                );


            group.avatar =
                result.secure_url;

        }


        // ==========================
        // COVER UPLOAD
        // ==========================

        if (
            req.files &&
            req.files.cover &&
            req.files.cover[0]
        ) {

            const file =
                req.files.cover[0];

            const result =
                await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(

                                {
                                    folder:
                                        "2chat/groups/covers",

                                    resource_type:
                                        "image"
                                },

                                (error, result) => {

                                    if(error){

                                        reject(error);

                                    }else{

                                        resolve(result);

                                    }

                                }

                            );

                        stream.end(
                            file.buffer
                        );

                    }
                );


            group.cover =
                result.secure_url;

        }

        // ==========================
// UPDATE PRIVACY
// ==========================

if (
    privacy === "public" ||
    privacy === "private"
) {

    group.privacy = privacy;

}


// ==========================
// SAVE GROUP
// ==========================

await group.save();

        // ==========================
        // SAVE GROUP
        // ==========================

        await group.save();


        // ==========================
        // SUCCESS
        // ==========================

        return res.json({

            success: true,

            message:
                "Group settings updated successfully.",

            group

        });


    } catch (error) {

        console.error(
            "UPDATE GROUP SETTINGS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to update group settings."

        });

    }

};

// ==================================================
// SEND GROUP INVITATION
// ==================================================

exports.sendGroupInvitation = async (req, res) => {

    try {

        const {
            groupId,
            username,
            invitee
        } = req.body;


        // ==========================
        // CHECK DATA
        // ==========================

        if (!groupId || !username || !invitee) {

            return res.status(400).json({

                success: false,

                message:
                    "Group ID, username and invitee are required."

            });

        }


        // ==========================
        // FIND GROUP
        // ==========================

        const group =
            await Group.findById(groupId);

        if (!group) {

            return res.status(404).json({

                success: false,

                message: "Group not found."

            });

        }


        // ==========================
        // OWNER / ADMIN ONLY
        // ==========================

        if (
            group.owner !== username &&
            !group.admins.includes(username)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Only owner or admins can invite members."

            });

        }


        // ==========================
        // CHECK USER
        // ==========================

        const userExists =
            await User.findOne({
                username: invitee
            });

        if (!userExists) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        // ==========================
        // ALREADY MEMBER
        // ==========================

        if (group.members.includes(invitee)) {

            return res.status(400).json({

                success: false,

                message:
                    "This user is already a member."

            });

        }


        // ==========================
        // CHECK EXISTING INVITATION
        // ==========================

        const existingInvitation =
            await GroupInvitation.findOne({

                groupId: group._id,

                invitee: invitee,

                status: "pending"

            });

        if (existingInvitation) {

            return res.status(400).json({

                success: false,

                message:
                    "Invitation already sent."

            });

        }


        // ==========================
        // CREATE INVITATION
        // ==========================

        const invitation =
            await GroupInvitation.create({

                groupId: group._id,

                groupName: group.name,

                inviter: username,

                invitee: invitee,

                status: "pending"

            });


        return res.json({

            success: true,

            message:
                "Group invitation sent successfully.",

            invitation

        });


    } catch (error) {

        console.error(
            "SEND GROUP INVITATION ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to send group invitation."

        });

    }

};

// ==================================================
// GET MY GROUP INVITATIONS
// ==================================================

// ==================================================
// GET MY GROUP INVITATIONS
// ==================================================

exports.getMyGroupInvitations = async (req, res) => {

    try {

        const username =
            String(req.params.username || "").trim();


        console.log(
            "GET GROUP INVITATIONS:",
            username
        );


        if (!username) {

            return res.status(400).json({

                success: false,

                message:
                    "Username is required."

            });

        }


        const invitations =
            await GroupInvitation.find({

                invitee: username,

                status: "pending"

            })
            .sort({
                createdAt: -1
            })
            .lean();


        console.log(
            "INVITATIONS FOUND:",
            invitations.length
        );


        return res.status(200).json({

            success: true,

            invitations

        });


    } catch (error) {

        console.error(
            "GET GROUP INVITATIONS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load group invitations."

        });

    }

};


// ==================================================
// ACCEPT GROUP INVITATION
// ==================================================

exports.acceptGroupInvitation = async (req, res) => {

    try {

        const {
            invitationId,
            username
        } = req.body;


        // ==========================
        // CHECK DATA
        // ==========================

        if (!invitationId || !username) {

            return res.status(400).json({

                success: false,

                message:
                    "Invitation ID and username are required."

            });

        }


        // ==========================
        // FIND INVITATION
        // ==========================

        const invitation =
            await GroupInvitation.findById(
                invitationId
            );

        if (!invitation) {

            return res.status(404).json({

                success: false,

                message:
                    "Invitation not found."

            });

        }


        // ==========================
        // SECURITY CHECK
        // ==========================

        if (invitation.invitee !== username) {

            return res.status(403).json({

                success: false,

                message:
                    "You cannot accept this invitation."

            });

        }


        // ==========================
        // CHECK STATUS
        // ==========================

        if (invitation.status !== "pending") {

            return res.status(400).json({

                success: false,

                message:
                    "This invitation is no longer active."

            });

        }


        // ==========================
        // FIND GROUP
        // ==========================

        const group =
            await Group.findById(
                invitation.groupId
            );

        if (!group) {

            invitation.status =
                "rejected";

            await invitation.save();

            return res.status(404).json({

                success: false,

                message:
                    "Group no longer exists."

            });

        }


        // ==========================
        // ADD MEMBER
        // ==========================

        if (!group.members.includes(username)) {

            group.members.push(username);

            group.memberCount =
                group.members.length;

            await group.save();

        }


        // ==========================
        // UPDATE INVITATION
        // ==========================

        invitation.status =
            "accepted";

        await invitation.save();


        return res.json({

            success: true,

            message:
                "You joined the group successfully.",

            group

        });


    } catch (error) {

        console.error(
            "ACCEPT GROUP INVITATION ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to accept invitation."

        });

    }

};

// ==================================================
// REJECT GROUP INVITATION
// ==================================================

exports.rejectGroupInvitation = async (req, res) => {

    try {

        const {
            invitationId,
            username
        } = req.body;


        // ==========================
        // CHECK DATA
        // ==========================

        if (!invitationId || !username) {

            return res.status(400).json({

                success: false,

                message:
                    "Invitation ID and username are required."

            });

        }


        // ==========================
        // FIND INVITATION
        // ==========================

        const invitation =
            await GroupInvitation.findById(
                invitationId
            );

        if (!invitation) {

            return res.status(404).json({

                success: false,

                message:
                    "Invitation not found."

            });

        }


        // ==========================
        // SECURITY CHECK
        // ==========================

        if (invitation.invitee !== username) {

            return res.status(403).json({

                success: false,

                message:
                    "You cannot reject this invitation."

            });

        }


        // ==========================
        // CHECK STATUS
        // ==========================

        if (invitation.status !== "pending") {

            return res.status(400).json({

                success: false,

                message:
                    "This invitation is no longer active."

            });

        }


        // ==========================
        // REJECT
        // ==========================

        invitation.status =
            "rejected";

        await invitation.save();


        return res.json({

            success: true,

            message:
                "Group invitation rejected."

        });


    } catch (error) {

        console.error(
            "REJECT GROUP INVITATION ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to reject invitation."

        });

    }

};

