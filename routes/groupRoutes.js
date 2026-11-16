const router = require("express").Router();

const protect = require("../middleware/auth");

const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage()
});

const {
    createGroup,
    getGroups,
    getGroup,
    getGroupByInviteCode,
    joinGroup,
    leaveGroup,
    deleteGroup,
    addMember,
    promoteToAdmin,
    removeAdmin,
    updateGroupSettings,

    // GROUP INVITATIONS
    sendGroupInvitation,
getMyGroupInvitations,
getSentGroupInvitations,
acceptGroupInvitation,
rejectGroupInvitation
    
} = require("../controllers/groupController");


// ==================================================
// GROUPS
// ==================================================

router.post(
    "/create",
    protect,
    createGroup
);

router.get(
    "/all",
    getGroups
);


// ==================================================
// GROUP INVITATIONS
// IMPORTANT: THESE MUST COME BEFORE /:id
// ==================================================

// Send invitation
router.post(
    "/invite",
    protect,
    sendGroupInvitation
);


// GET INVITATIONS ALREADY SENT BY THIS USER
router.get(
    "/invitations/sent/:username",
    protect,
    getSentGroupInvitations
);

router.get(
    "/invitations/:username",
    protect,
    getMyGroupInvitations
);
    

// Accept invitation
router.put(
    "/invite/accept",
    protect,
    acceptGroupInvitation
);

// Reject invitation
router.put(
    "/invite/reject",
    protect,
    rejectGroupInvitation
);

// ==================================================
// GROUP ACTIONS
// ==================================================

router.put(
    "/join",
    protect,
    joinGroup
);

router.put(
    "/leave",
    protect,
    leaveGroup
);

router.delete(
    "/delete",
    protect,
    deleteGroup
);

router.put(
    "/add-member", 
    protect,
    addMember
);

router.put(
    "/make-admin",
    promoteToAdmin
);

router.put(
    "/remove-admin",
    removeAdmin
);


// ==================================================
// GROUP SETTINGS
// ==================================================

router.put(
    "/settings",

    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "cover",
            maxCount: 1
        }
    ]),

    updateGroupSettings
);


// ==================================================
// GET GROUP BY INVITE CODE
// IMPORTANT: MUST COME BEFORE /:id
// ==================================================

router.get(
    "/invite/:inviteCode",
    getGroupByInviteCode
);

// ==================================================
// GET SINGLE GROUP
// IMPORTANT: KEEP THIS AT THE VERY END
// ==================================================

router.get(
    "/:id",
    getGroup
);


module.exports = router;
