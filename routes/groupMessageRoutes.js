const router = require("express").Router();

const protect = require("../middleware/auth");

router.use(protect);

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (
            file.fieldname === "image" &&
            file.mimetype.startsWith("image/")
        ) {
            return cb(null, true);
        }

        if (
            file.fieldname === "voice" &&
            file.mimetype.startsWith("audio/")
        ) {
            return cb(null, true);
        }

        cb(new Error("Invalid file type."));
    }
});

const {
    sendMessage,
    getMessages,
    reactToMessage,
    deleteMessage,
    editMessage,
    markMessageAsSeen,
    pinMessage,
    unpinMessage
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

    // Pin group message
router.put(
    "/pin",
    pinMessage
);

// Unpin group message
router.put(
    "/unpin",
    unpinMessage
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
