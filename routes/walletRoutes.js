const router = require("express").Router();

const protect = require("../middleware/auth");

const {
  getWallet,
  getEarnings
} = require("../controllers/walletController");

router.get(
  "/",
  protect,
  getWallet
);

router.get(
  "/earnings",
  protect,
  getEarnings
);

module.exports = router;
