const router =
require("express").Router();

const upload =
require("../middleware/upload");

const {
sendMessage,
sendVoice,
getMessages,
getChats,
reactMessage
} = require("../controllers/messageController");

// Send Message
router.post(
"/send",
upload.single("file"),
sendMessage
);

router.post(
"/voice",
upload.single("voice"),
sendVoice
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

router.put(
"/react",
reactMessage
);

module.exports = router;
