const router =
  require("express").Router();

const protect =
  require("../middleware/auth");

const {
  createCoinPurchase
} =
  require("../controllers/coinPurchaseController");


// =====================================================
// CREATE COIN PURCHASE ORDER
// =====================================================

router.post(
  "/",
  protect,
  createCoinPurchase
);


// =====================================================
// EXPORT
// =====================================================

module.exports =
  router;
