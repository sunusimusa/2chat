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


// ================= REACTION =================

router.put(
    "/react",
    reactMessage
);


// ================= CLEAR CHAT =================

router.delete(
    "/clear/:user1/:user2",
    clearChat
);


// ================= DELETE ONE MESSAGE =================

router.delete(
    "/:id",
    deleteMessage
);

router.put(
    "/delete-everyone/:id",
    deleteForEveryone
);


module.exports = router;
