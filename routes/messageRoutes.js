const router = require("express").Router();

const upload = require("../middleware/upload");

const protect = require("../middleware/auth");

const {
    sendMessage,
    sendVoice,
    getMessages,
    getChats,
    reactMessage,
    deleteMessage,
    clearChat,
    deleteForEveryone
} = require("../controllers/messageController");


// ================= SEND =================

router.post(
    "/send",
    protect,
    upload.single("file"),
    sendMessage
);

router.post(
    "/voice",
    protect,
    upload.single("voice"),
    sendVoice
);

// ================= GET =================

router.get(
    "/chat",
    protect,
    getMessages
);

router.get(
    "/list/:username",
    protect,
    getChats
);


// ================= REACTIONS =================

router.put(
    "/react",
    protect,
    reactMessage
);


// ================= DELETE =================

router.delete(
    "/delete/:id",
    protect,
    deleteMessage
);

router.put(
    "/delete-everyone/:id",
    protect,
    deleteForEveryone
);

// Clear chat
router.delete(
    "/clear/:user1/:user2",
    clearChat
);

module.exports = router;
