const router = require("express").Router();

const {
    createGroup,
    getGroups,
    getGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
    addMember,
    promoteToAdmin,
    removeAdmin
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

// Promote member to admin
router.put(
    "/promote-admin",
    promoteToAdmin
);

// Remove admin
router.put(
    "/remove-admin",
    removeAdmin
);

module.exports = router;
