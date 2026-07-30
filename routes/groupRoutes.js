const router = require("express").Router();

const {
    createGroup,
    getGroups,
    getGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
    addMember
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

module.exports = router;
