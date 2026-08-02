const router = require("express").Router();
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage
});

const {
    sendMessage,
    getMessages,
    reactToMessage,
    deleteMessage,
    editMessage,
    markMessageAsSeen
} = require("../controllers/groupMessageController");

/* ==========================
GROUP MESSAGES
========================== */

// Send Text + Image + Voice
router.post(
    "/send",
    upload.fields([
        {
            name: "image",
            maxCount: 1
        },
        {
            name: "voice",
            maxCount: 1
        }
    ]),
    sendMessage
);

// React to message
router.put(
    "/react",
    reactToMessage
);

router.put(
    "/edit",
    editMessage
);

// Mark message as seen
router.put(
    "/seen",
    markMessageAsSeen
);

// Load Group Messages
router.get(
    "/:groupId",
    getMessages
);

router.put(
    "/delete",
    deleteMessage
);

module.exports = router;
