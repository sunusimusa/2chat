const router = require("express").Router();

const protect = require("../middleware/auth");

const {
  getWallet,
  testAddCoins,
  getEarnings
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

router.get(
  "/earnings",
  protect,
  getEarnings
);

module.exports = router;
