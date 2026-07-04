const router =
require("express").Router();

const {

getNotifications,
readNotification

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

module.exports = router;
