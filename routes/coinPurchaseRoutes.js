const router =
    require("express").Router();

const protect =
    require("../middleware/auth");


const {
    createCoinPurchase,
    initializeCoinPurchasePayment
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
// INITIALIZE PAYMENT
// =====================================================

router.post(
    "/:id/initialize-payment",
    protect,
    initializeCoinPurchasePayment
);


// =====================================================
// EXPORT
// =====================================================

module.exports =
    router;
