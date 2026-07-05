const router =
require("express").Router();

const upload =
require("../middleware/upload");

const {
sendMessage,
getMessages,
getChats,
reactMessage
} = require("../controllers/messageController");

// Send Message
router.post(
"/send",
upload.single("image"),
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

router.put(
"/react",
reactMessage
);

module.exports = router;
