const router = require("express").Router();

const protect = require("../middleware/auth");

const {
  sendGift
} = require("../controllers/giftController");


// =========================================
// SEND GIFT
// =========================================

router.post(
  "/send",
  protect,
  sendGift
);


module.exports = router;
