const router = require("express").Router();
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage });

const {

    sendMessage,

    getMessages

} = require("../controllers/groupMessageController");

/* ==========================
GROUP MESSAGES
========================== */

// Send Group Message
router.post("/send", upload.single("file"), sendMessage);

// Load Group Messages
router.get("/:groupId", getMessages);

module.exports = router;
