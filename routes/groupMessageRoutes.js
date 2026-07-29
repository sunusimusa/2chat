const router = require("express").Router();

const {

    sendMessage,

    getMessages

} = require("../controllers/groupMessageController");

/* ==========================
GROUP MESSAGES
========================== */

// Send Group Message
router.post("/send", sendMessage);

// Load Group Messages
router.get("/:groupId", getMessages);

module.exports = router;
