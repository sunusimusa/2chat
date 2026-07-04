const router =
require("express").Router();

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
