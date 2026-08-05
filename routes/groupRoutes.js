const router = require("express").Router();

const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage()
});

const {
    createGroup,
    getGroups,
    getGroup,
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
    acceptGroupInvitation,
    rejectGroupInvitation

} = require("../controllers/groupController");


// ==================================================
// GROUPS
// ==================================================

router.post(
    "/create",
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
    sendGroupInvitation
);


router.get(
    "/invitations/:username",
    (req, res, next) => {

        console.log(
            "🔥 INVITATIONS ROUTE HIT:",
            req.params.username
        );

        next();

    },
    getMyGroupInvitations
);
    

// Accept invitation
router.put(
    "/invite/accept",
    acceptGroupInvitation
);

// Reject invitation
router.put(
    "/invite/reject",
    rejectGroupInvitation
);


// ==================================================
// GROUP ACTIONS
// ==================================================

router.put(
    "/join",
    joinGroup
);

router.put(
    "/leave",
    leaveGroup
);

router.delete(
    "/delete",
    deleteGroup
);

router.put(
    "/add-member",
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
// GET SINGLE GROUP
// IMPORTANT: KEEP THIS AT THE VERY END
// ==================================================

router.get(
    "/:id",
    getGroup
);


module.exports = router;
