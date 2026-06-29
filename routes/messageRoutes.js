const upload =
require("../middleware/upload");
const router =
require("express").Router();

const {
sendMessage,
getMessages,
getChats
} = require("../controllers/messageController");

// Send Message
router.post(
"/send",
sendMessage
);

// Get Chat
router.get(
"/chat",
getMessages
);

router.get(
"/list/:username",
getChats
);

module.exports = router;
