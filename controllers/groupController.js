const Group = require("../models/Group");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const GroupInvitation =
    require("../models/GroupInvitation");

// ================= CREATE GROUP =================

const crypto = require("crypto");

exports.createGroup = async (req, res) => {

    try {

        const {
            name,
            description,
            avatar,
            privacy
        } = req.body;

        // ==========================
        // AUTHENTICATED USER
        // ==========================

        const owner = req.user?.username;

        if (!owner) {

            return res.status(401).json({
                success: false,
                message: "Not authorized."
            });

        }

        // ==========================
        // CHECK GROUP NAME
        // ==========================

        if (
            typeof name !== "string" ||
            !name.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Group name is required."
            });

        }

        // ==========================
        // CHECK PRIVACY
        // ==========================

        const groupPrivacy =
            privacy === "private"
                ? "private"
                : "public";

        // ==========================
        // GENERATE UNIQUE INVITE CODE
        // ==========================

        let inviteCode;
        let existingGroup;

        do {

            inviteCode =
                "2chat_" +
                crypto.randomBytes(8).toString("hex");

            existingGroup =
                await Group.findOne({
                    inviteCode
                });

        } while (existingGroup);

        // ==========================
        // CREATE GROUP
        // ==========================

        const group = await Group.create({

            name: name.trim(),

            description:
                typeof description === "string"
                    ? description.trim()
                    : "",

            avatar:
                typeof avatar === "string" && avatar.trim()
                    ? avatar.trim()
                    : "/images/default-group.png",

            cover:
                "/images/default-group-cover.jpg",

            owner: owner,

            inviteCode,

            admins: [owner],

            members: [owner],

            memberCount: 1,

            privacy: groupPrivacy,

            lastMessage: "",

            lastMessageSender: "",

            lastMessageTime: null

        });

        // ==========================
        // SUCCESS
        // ==========================

        return res.status(201).json({

            success: true,

            message: "Group created successfully.",

            group,

            inviteCode,

            groupLink:
                `/group.html?invite=${encodeURIComponent(inviteCode)}`

        });

    } catch (error) {

        console.error(
            "CREATE GROUP ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Failed to create group."

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

// ==================================================
// GET GROUP BY INVITE CODE
// ==================================================

exports.getGroupByInviteCode = async (req, res) => {

    try {

        const inviteCode =
            String(req.params.inviteCode || "").trim();


        // ==========================
        // CHECK INVITE CODE
        // ==========================

        if (!inviteCode) {

            return res.status(400).json({

                success: false,

                message:
                    "Invite code is required."

            });

        }


        // ==========================
        // FIND GROUP
        // ==========================

        const group =
            await Group.findOne({
                inviteCode: inviteCode
            }).lean();


        // ==========================
        // GROUP NOT FOUND
        // ==========================

        if (!group) {

            return res.status(404).json({

                success: false,

                message:
                    "Invalid or expired group link."

            });

        }


        // ==========================
        // MEMBER COUNT
        // ==========================

        group.memberCount =
            Array.isArray(group.members)
                ? group.members.length
                : 0;


        // ==========================
        // SUCCESS
        // ==========================

        return res.status(200).json({

            success: true,

            group

        });


    } catch (error) {

        console.error(
            "GET GROUP BY INVITE CODE ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load group."

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

    try {

        const { groupId } = req.body;

        // ==========================
        // AUTHENTICATED USER
        // ==========================

        const username = req.user?.username;

        if (!username) {

            return res.status(401).json({
                success: false,
                message: "Not authorized."
            });

        }

        // ==========================
        // CHECK GROUP ID
        // ==========================

        if (!groupId) {

            return res.status(400).json({
                success: false,
                message: "Group ID is required."
            });

        }

        // ==========================
        // FIND GROUP
        // ==========================

        const group = await Group.findById(groupId);

        if (!group) {

            return res.status(404).json({
                success: false,
                message: "Group not found."
            });

        }

        // ==========================
        // ENSURE MEMBERS ARRAY
        // ==========================

        if (!Array.isArray(group.members)) {
            group.members = [];
        }

        // ==========================
        // CHECK ALREADY MEMBER
        // ==========================

        if (group.members.includes(username)) {

            return res.json({
                success: true,
                message: "You are already a member of this group.",
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
                message: "This is a private group. You need an invitation to join."
            });

        }

        // ==========================
        // PUBLIC GROUP
        // ==========================

        group.members.push(username);

        group.memberCount = group.members.length;

        // ==========================
        // FIX OLD GROUP INVITE CODE
        // ==========================

        if (!group.inviteCode) {

            let inviteCode;
            let existingGroup;

            do {

                inviteCode =
                    "2chat_" +
                    crypto.randomBytes(8).toString("hex");

                existingGroup = await Group.findOne({
                    inviteCode
                });

            } while (existingGroup);

            group.inviteCode = inviteCode;

        }

        await group.save();

        // ==========================
        // SUCCESS
        // ==========================

        return res.json({
            success: true,
            private: false,
            message: "You joined the group successfully.",
            group
        });

    } catch (error) {

        console.error(
            "JOIN GROUP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to join group."
        });

    }

};
                

// ================= LEAVE GROUP =================

exports.leaveGroup = async (req, res) => {

    try {

        const { groupId } = req.body;

        // ==========================
        // AUTHENTICATED USER
        // ==========================

        const username = req.user?.username;

        if (!username) {

            return res.status(401).json({
                success: false,
                message: "Not authorized."
            });

        }

        // ==========================
        // CHECK GROUP ID
        // ==========================

        if (!groupId) {

            return res.status(400).json({
                success: false,
                message: "Group ID is required."
            });

        }

        // ==========================
        // FIND GROUP
        // ==========================

        const group = await Group.findById(groupId);

        if (!group) {

            return res.status(404).json({
                success: false,
                message: "Group not found."
            });

        }

        // ==========================
        // ENSURE ARRAYS
        // ==========================

        if (!Array.isArray(group.members)) {
            group.members = [];
        }

        if (!Array.isArray(group.admins)) {
            group.admins = [];
        }

        // ==========================
        // OWNER CANNOT LEAVE
        // ==========================

        if (group.owner === username) {

            return res.status(400).json({
                success: false,
                message: "Group owner cannot leave. Transfer ownership or delete the group."
            });

        }

        // ==========================
        // CHECK MEMBERSHIP
        // ==========================

        if (!group.members.includes(username)) {

            return res.status(400).json({
                success: false,
                message: "You are not a member of this group."
            });

        }

        // ==========================
        // REMOVE MEMBER
        // ==========================

        const updatedMembers =
            group.members.filter(
                member => member !== username
            );

        // ==========================
        // REMOVE FROM ADMINS
        // ==========================

        const updatedAdmins =
            group.admins.filter(
                admin => admin !== username
            );

        // ==========================
        // UPDATE DATABASE
        // ==========================

        await Group.updateOne(
            {
                _id: group._id,
                members: username
            },
            {
                $set: {
                    members: updatedMembers,
                    admins: updatedAdmins,
                    memberCount: updatedMembers.length
                }
            }
        );

        // ==========================
        // SUCCESS
        // ==========================

        return res.json({
            success: true,
            message: "You left the group successfully."
        });

    } catch (error) {

        console.error(
            "LEAVE GROUP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to leave group."
        });

    }

};
            
// ================= DELETE GROUP =================

exports.deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.body;

        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group ID is required."
            });
        }

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        // Identify the requester using the verified JWT
        const requester = req.user.username;

        // Only the actual group owner can delete the group
        if (group.owner !== requester) {
            return res.status(403).json({
                success: false,
                message: "Only the group owner can delete this group."
            });
        }

        await Group.findByIdAndDelete(groupId);

        return res.json({
            success: true,
            message: "Group deleted successfully."
        });

    } catch (err) {
        console.error("DELETE GROUP ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "An error occurred while deleting the group."
        });
    }
};

// ================= ADD MEMBER =================

exports.addMember = async (req, res) => {
    try {
        const { groupId, member } = req.body;

        // Validate input
        if (!groupId || !member || typeof member !== "string") {
            return res.status(400).json({
                success: false,
                message: "Group ID and member username are required."
            });
        }

        const memberUsername = member.trim();
        const requester = req.user.username;

        if (!memberUsername) {
            return res.status(400).json({
                success: false,
                message: "Invalid member username."
            });
        }

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        // Ensure arrays exist
        group.members = group.members || [];
        group.admins = group.admins || [];

        // Only the actual owner or an admin can add members
        if (
            group.owner !== requester &&
            !group.admins.includes(requester)
        ) {
            return res.status(403).json({
                success: false,
                message: "Only owner or admins can add members."
            });
        }

        // Check whether the user exists
        const userExists = await User.findOne({
            username: memberUsername
        });

        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Prevent duplicate members
        if (group.members.includes(memberUsername)) {
            return res.status(409).json({
                success: false,
                message: "User is already in this group."
            });
        }

        group.members.push(memberUsername);
        group.memberCount = group.members.length;

        await group.save();

        return res.json({
            success: true,
            message: "Member added successfully.",
            group
        });

    } catch (err) {
        console.error("Add Member Error:", err);

        return res.status(500).json({
            success: false,
            message: "An error occurred while adding the member."
        });
    }
};
                
// ==================================================
// PROMOTE MEMBER TO ADMIN
// ==================================================

exports.promoteToAdmin = async (req, res) => {
    try {
        const { groupId, member } = req.body;

        if (
            !groupId ||
            !member ||
            typeof member !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Group ID and member username are required."
            });
        }

        const memberUsername = member.trim();

        if (!memberUsername) {
            return res.status(400).json({
                success: false,
                message: "Invalid member username."
            });
        }

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        const requester = req.user.username;

        // Only the actual owner can promote admins
        if (group.owner !== requester) {
            return res.status(403).json({
                success: false,
                message: "Only the group owner can promote admins."
            });
        }

        const members = Array.isArray(group.members)
            ? group.members
            : [];

        const admins = Array.isArray(group.admins)
            ? group.admins
            : [];

        if (!members.includes(memberUsername)) {
            return res.status(400).json({
                success: false,
                message: "This user is not a member of the group."
            });
        }

        if (group.owner === memberUsername) {
            return res.status(400).json({
                success: false,
                message: "Group owner is already the owner."
            });
        }

        if (admins.includes(memberUsername)) {
            return res.status(409).json({
                success: false,
                message: "This user is already an admin."
            });
        }

        group.admins = admins;
        group.admins.push(memberUsername);

        await group.save();

        return res.json({
            success: true,
            message: "Member promoted to admin successfully.",
            group
        });

    } catch (err) {
        console.error("PROMOTE ADMIN ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "An error occurred while promoting the admin."
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
        const { groupId, invitee } = req.body;

        // GET AUTHENTICATED USER
        const username = req.user.username;

        // CHECK REQUIRED DATA
        if (!groupId || !invitee) {
            return res.status(400).json({
                success: false,
                message: "Group ID and invitee are required."
            });
        }

        if (!username) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const targetUsername = String(invitee).trim();

        if (!targetUsername) {
            return res.status(400).json({
                success: false,
                message: "Invitee username is required."
            });
        }

        // PREVENT SELF INVITATION
        if (
            username.toLowerCase() ===
            targetUsername.toLowerCase()
        ) {
            return res.status(400).json({
                success: false,
                message: "You cannot invite yourself."
            });
        }

        // FIND GROUP
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        // OWNER / ADMIN AUTHORIZATION
        const isOwner = group.owner === username;

        const isAdmin = Array.isArray(group.admins) &&
            group.admins.includes(username);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only owner or admins can invite members."
            });
        }

        // CHECK INVITEE EXISTS
        const userExists = await User.findOne({
            username: targetUsername
        }).select("username");

        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // ALREADY MEMBER
        if (group.members.includes(userExists.username)) {
            return res.status(400).json({
                success: false,
                message: "This user is already a member."
            });
        }

        // CHECK EXISTING PENDING INVITATION
        const existingInvitation = await GroupInvitation.findOne({
            groupId: group._id,
            invitee: userExists.username,
            status: "pending"
        });

        if (existingInvitation) {
            return res.status(400).json({
                success: false,
                message: "Invitation already sent."
            });
        }

        // CREATE INVITATION
        const invitation = await GroupInvitation.create({
            groupId: group._id,
            groupName: group.name,
            inviter: username,
            invitee: userExists.username,
            status: "pending"
        });

        return res.status(201).json({
            success: true,
            message: "Group invitation sent successfully.",
            invitation
        });

    } catch (error) {
        console.error(
            "SEND GROUP INVITATION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to send group invitation."
        });
    }
};

// ==================================================
// GET SENT GROUP INVITATIONS
// ==================================================


exports.getSentGroupInvitations = async (req, res) => {

    try {

        // ==========================
        // AUTHENTICATED USER
        // ==========================

        const username = req.user?.username;

        if (!username) {

            return res.status(401).json({
                success: false,
                message: "Not authorized."
            });

        }

        // ==========================
        // CHECK GROUP ID
        // ==========================

        const groupId =
            String(req.query.groupId || "").trim();

        if (!groupId) {

            return res.status(400).json({
                success: false,
                message: "Group ID is required."
            });

        }

        // ==========================
        // FIND SENT PENDING INVITATIONS
        // ==========================

        const invitations =
            await GroupInvitation.find({

                groupId: groupId,

                inviter: username,

                status: "pending"

            })
            .sort({
                createdAt: -1
            })
            .lean();

        // ==========================
        // GET INVITED USERNAMES
        // ==========================

        const invitedUsers =
            invitations.map(invitation =>
                String(invitation.invitee).trim()
            );

        // ==========================
        // RESPONSE
        // ==========================

        return res.status(200).json({

            success: true,

            invitations,

            invitedUsers

        });

    } catch (error) {

        console.error(
            "GET SENT GROUP INVITATIONS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Failed to load sent invitations."

        });

    }

};

// ==================================================
// GET MY GROUP INVITATIONS
// ==================================================

exports.getMyGroupInvitations = async (req, res) => {

    try {

        // ==========================
        // AUTHENTICATED USER
        // ==========================

        const username = req.user?.username;

        if (!username) {

            return res.status(401).json({
                success: false,
                message: "Not authorized."
            });

        }

        // ==========================
        // FIND PENDING INVITATIONS
        // ==========================

        const invitations =
            await GroupInvitation.find({
                invitee: username,
                status: "pending"
            })
            .sort({
                createdAt: -1
            })
            .lean();

        // ==========================
        // RESPONSE
        // ==========================

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
            message: "Failed to load group invitations."
        });

    }

};
        
// ==================================================
// ACCEPT GROUP INVITATION
// ==================================================

exports.acceptGroupInvitation = async (req, res) => {
    try {
        const { invitationId } = req.body;

        // GET AUTHENTICATED USER
        const username = req.user.username;

        if (!invitationId) {
            return res.status(400).json({
                success: false,
                message: "Invitation ID is required."
            });
        }

        if (!username) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        // FIND INVITATION
        const invitation =
            await GroupInvitation.findById(invitationId);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found."
            });
        }

        // VERIFY INVITATION OWNER
        if (
            String(invitation.invitee).toLowerCase() !==
            String(username).toLowerCase()
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot accept this invitation."
            });
        }

        // CHECK INVITATION STATUS
        if (invitation.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This invitation is no longer active."
            });
        }

        // FIND GROUP
        const group =
            await Group.findById(invitation.groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group no longer exists."
            });
        }

        // ENSURE MEMBERS ARRAY EXISTS
        if (!Array.isArray(group.members)) {
            group.members = [];
        }

        // ADD MEMBER IF NOT ALREADY PRESENT
        const alreadyMember = group.members.some(
            member =>
                String(member).toLowerCase() ===
                String(username).toLowerCase()
        );

        if (!alreadyMember) {
            group.members.push(username);
            group.memberCount = group.members.length;
            await group.save();
        }

        // UPDATE INVITATION STATUS
        invitation.status = "accepted";
        invitation.respondedAt = new Date();

        await invitation.save();

        return res.json({
            success: true,
            message: "You joined the group successfully.",
            group
        });

    } catch (error) {
        console.error(
            "ACCEPT GROUP INVITATION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to accept invitation."
        });
    }
};

// ==================================================
// REJECT GROUP INVITATION
// ==================================================


exports.rejectGroupInvitation = async (req, res) => {

    try {

        const { invitationId } = req.body;

        // ==========================
        // AUTHENTICATED USER
        // ==========================

        const username = req.user?.username;

        if (!username) {

            return res.status(401).json({
                success: false,
                message: "Not authorized."
            });

        }

        // ==========================
        // CHECK DATA
        // ==========================

        if (!invitationId) {

            return res.status(400).json({
                success: false,
                message: "Invitation ID is required."
            });

        }

        // ==========================
        // FIND INVITATION
        // ==========================

        const invitation =
            await GroupInvitation.findById(invitationId);

        if (!invitation) {

            return res.status(404).json({
                success: false,
                message: "Invitation not found."
            });

        }

        // ==========================
        // SECURITY CHECK
        // ==========================

        if (
            String(invitation.invitee).toLowerCase() !==
            String(username).toLowerCase()
        ) {

            return res.status(403).json({
                success: false,
                message: "You cannot reject this invitation."
            });

        }

        // ==========================
        // CHECK STATUS
        // ==========================

        if (invitation.status !== "pending") {

            return res.status(400).json({
                success: false,
                message: "This invitation is no longer active."
            });

        }

        // ==========================
        // REJECT INVITATION
        // ==========================

        invitation.status = "rejected";
        invitation.respondedAt = new Date();

        await invitation.save();

        return res.json({
            success: true,
            message: "Group invitation rejected."
        });

    } catch (error) {

        console.error(
            "REJECT GROUP INVITATION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to reject invitation."
        });

    }

};
            
