const router = require("express").Router();
const protect = require("../middleware/auth");

router.use(protect);

const {
    getNotifications,
    readNotification,
    getUnreadCount,
    getNotificationSettings,
    updateNotificationSettings
} = require("../controllers/notificationController");


// =========================================
// NOTIFICATION SETTINGS
// =========================================

router.get(
    "/settings",
    getNotificationSettings
);

router.put(
    "/settings",
    updateNotificationSettings
);


// =========================================
// NOTIFICATION LIST
// =========================================

router.get("/:username", getNotifications);

router.put("/read", readNotification);

router.get("/count/:username", getUnreadCount);


module.exports = router;
