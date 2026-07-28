const router = require("express").Router();

const upload = require("../middleware/upload");

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
    upload.single("file"),
    sendMessage
);

router.post(
    "/voice",
    upload.single("voice"),
    sendVoice
);


// ================= GET =================

router.get(
    "/chat",
    getMessages
);

router.get(
    "/list/:username",
    getChats
);


// ================= REACTIONS =================

router.put(
    "/react",
    reactMessage
);


// ================= DELETE =================

// Delete for me
router.delete(
    "/delete/:id",
    deleteMessage
);

// Delete for everyone
router.put(
    "/delete-everyone/:id",
    deleteForEveryone
);

// Clear chat
router.delete(
    "/clear/:user1/:user2",
    clearChat
);

module.exports = router;
