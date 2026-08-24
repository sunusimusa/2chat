const express =
    require("express");

const router =
    express.Router();


const protect =
    require("../middleware/auth");


const {
    createCoinPurchase,
    initializeCoinPurchasePayment,
    createCoinPaymentMethod
} =
    require("../controllers/coinPurchaseController");


// =====================================================
// CREATE COIN PURCHASE
// =====================================================
//
// POST /api/coin-purchases
//
// User ya zaɓi package.
// Wannan zai ƙirƙiri pending purchase.
// =====================================================

router.post(
    "/",
    protect,
    createCoinPurchase
);


// =====================================================
// INITIALIZE FLUTTERWAVE PAYMENT
// =====================================================
//
// POST /api/coin-purchases/:id/initialize-payment
//
// Wannan zai fara payment bayan an shirya payment
// method.
// =====================================================

router.post(
    "/:id/initialize-payment",
    protect,
    initializeCoinPurchasePayment
);


// =====================================================
// CREATE FLUTTERWAVE PAYMENT METHOD
// =====================================================
//
// POST /api/coin-purchases/:id/payment-method
//
// Wannan endpoint ne na secure payment-method step.
// =====================================================

router.post(
    "/:id/payment-method",
    protect,
    createCoinPaymentMethod
);


// =====================================================
// EXPORT
// =====================================================

module.exports =
    router;
