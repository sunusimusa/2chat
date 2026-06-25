const router =
require("express").Router();

const {
sendMessage,
getMessages
}
=
require("../controllers/messageController");

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

module.exports = router;
