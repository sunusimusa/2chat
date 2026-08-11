const router = require("express").Router();

const protect = require("../middleware/auth");

const {
  getWallet
} = require("../controllers/walletController");


router.get(
  "/",
  protect,
  getWallet
);


module.exports = router;
