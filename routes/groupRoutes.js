const router = require("express").Router();

const {
    createGroup,
    getGroups,
    getGroup,
    joinGroup,
    leaveGroup
} = require("../controllers/groupController");

// Create Group
router.post("/create", createGroup);

// Get all groups
router.get("/all", getGroups);

// Get single group
router.get("/:id", getGroup);

// Join group
router.put("/join", joinGroup);

// Leave group
router.put("/leave", leaveGroup);

module.exports = router;
