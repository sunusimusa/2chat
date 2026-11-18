const router =
require("express").Router();

const protect = require("../middleware/auth");

router.use(protect);

const {

getNotifications,

readNotification,

getUnreadCount

} =
require("../controllers/notificationController");

router.get(
"/:username",
getNotifications
);

router.put(
"/read",
readNotification
);

router.get(
"/count/:username",
getUnreadCount
);

module.exports = router;
