const express =
    require("express");

const router =
    express.Router();

const protect =
    require("../middleware/auth");

const {
    createCoinPurchase,
    getCoinPurchase,
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
// =====================================================

router.post(
    "/",
    protect,
    createCoinPurchase
);


// =====================================================
// GET COIN PURCHASE
// =====================================================
//
// GET /api/coin-purchases/:id
//
// coinPayment.html yana amfani da wannan.
// =====================================================

router.get(
    "/:id",
    protect,
    getCoinPurchase
);


// =====================================================
// INITIALIZE FLUTTERWAVE PAYMENT
// =====================================================
//
// POST /api/coin-purchases/:id/initialize-payment
//
// Wannan shi zai fara Flutterwave payment.
// =====================================================

router.post(
    "/:id/initialize-payment",
    protect,
    initializeCoinPurchasePayment
);


// =====================================================
// CREATE PAYMENT METHOD
// =====================================================
//
// Wannan endpoint za mu iya barinsa idan service ɗinmu
// yana buƙatar shi a wasu payment flows.
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
