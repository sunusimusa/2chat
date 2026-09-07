const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth");

const {
    createCoinPurchase,
    initializeCoinPurchasePayment,
    getCoinPurchase,
    verifyCoinPurchasePayment
} = require("../controllers/coinPurchaseController");


// ========================================
// CREATE COIN PURCHASE
// POST /api/coin-purchases
// ========================================
router.post(
    "/",
    protect,
    createCoinPurchase
);


// ========================================
// GET COIN PURCHASE
// GET /api/coin-purchases/:id
// ========================================
router.get(
    "/:id",
    protect,
    getCoinPurchase
);


// ========================================
// INITIALIZE PAYSTACK PAYMENT
// POST /api/coin-purchases/:id/initialize-payment
// ========================================
router.post(
    "/:id/initialize-payment",
    protect,
    initializeCoinPurchasePayment
);


router.post(
    "/:id/verify-payment",
    protect,
    verifyCoinPurchasePayment
);

module.exports = router;
