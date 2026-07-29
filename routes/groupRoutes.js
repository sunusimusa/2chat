const router = require("express").Router();

const {

    createGroup,

    getGroups,

    getGroup,

    joinGroup,

    leaveGroup

} = require("../controllers/groupController");

/* ==========================
   GROUPS
========================== */

// Create Group
router.post("/create", createGroup);

// Get All Groups
router.get("/all", getGroups);

// Get Single Group
router.get("/group/:id", getGroup);

// Join Group
router.put("/join", joinGroup);

// Leave Group
router.put("/leave", leaveGroup);

module.exports = router;
