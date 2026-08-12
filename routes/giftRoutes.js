const router = require("express").Router();

const protect = require("../middleware/auth");

const {
  sendGift,
  getReceivedGifts
} = require("../controllers/giftController");


// =========================================
// SEND GIFT
// =========================================

router.post(
  "/send",
  protect,
  sendGift
);


// =========================================
// RECEIVED GIFTS
// =========================================

router.get(
  "/received",
  protect,
  getReceivedGifts
);


module.exports = router;
