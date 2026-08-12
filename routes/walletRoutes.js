const router = require("express").Router();

const protect = require("../middleware/auth");

const {
  getWallet,
  testAddCoins
} = require("../controllers/walletController");

router.get(
  "/",
  protect,
  getWallet
);

router.post(
  "/test-add-coins",
  protect,
  testAddCoins
);

module.exports = router;
