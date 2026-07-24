const router = require("express").Router();

const upload = require("../middleware/upload");

const {
  sendMessage,
  sendVoice,
  getMessages,
  getChats,
  reactMessage
} = require("../controllers/messageController");

// Send text/image
router.post(
  "/send",
  upload.single("file"),
  sendMessage
);

// Send voice message
router.post(
  "/voice",
  upload.single("voice"),
  sendVoice
);

// Get messages
router.get("/chat", getMessages);

// Chat list
router.get("/list/:username", getChats);

// React
router.put("/react", reactMessage);

module.exports = router;
