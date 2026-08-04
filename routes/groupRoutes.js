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
    updateGroupSettings
} = require("../controllers/groupController");

/* ==========================
   GROUPS
========================== */

// Create Group
router.post("/create", createGroup);

// Get All Groups
router.get("/all", getGroups);

// Get Single Group
router.get("/:id", getGroup);

// Join Group
router.put("/join", joinGroup);

// Leave Group
router.put("/leave", leaveGroup);

// Delete group
router.delete("/delete", deleteGroup);

// Add member
router.put("/add-member", addMember);

// Make member admin
router.put(
    "/make-admin",
    promoteToAdmin
);

// Remove admin
router.put(
    "/remove-admin",
    removeAdmin
);


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


module.exports = router;
