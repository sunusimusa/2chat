const express =
    require("express");

const router =
    express.Router();

const protect =
    require("../middleware/auth");

const {
    createCoinPurchase,
    initializeCoinPurchasePayment,
    createCoinPaymentMethod,
    getCoinPurchase
} =
    require("../controllers/coinPurchaseController");


// =====================================================
// CREATE PURCHASE
// =====================================================

router.post(
    "/",
    protect,
    createCoinPurchase
);


// =====================================================
// GET PURCHASE
// =====================================================

router.get(
    "/:id",
    protect,
    getCoinPurchase
);


// =====================================================
// CREATE PAYMENT METHOD
// =====================================================

router.post(
    "/:id/payment-method",
    protect,
    createCoinPaymentMethod
);


// =====================================================
// INITIALIZE PAYMENT
// =====================================================

router.post(
    "/:id/initialize-payment",
    protect,
    initializeCoinPurchasePayment
);


module.exports =
    router;
