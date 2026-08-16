const router = require("express").Router();

const protect = require("../middleware/auth");

const {
    createWithdrawal,
    getWithdrawalHistory,
    getWithdrawalById,
    cancelWithdrawal
} = require("../controllers/withdrawalController");


// =========================================
// CREATE WITHDRAWAL
// =========================================

router.post(
    "/",
    protect,
    createWithdrawal
);


// =========================================
// GET WITHDRAWAL HISTORY
// =========================================

router.get(
    "/",
    protect,
    getWithdrawalHistory
);


// =========================================
// GET SINGLE WITHDRAWAL
// =========================================

router.get(
    "/:id",
    protect,
    getWithdrawalById
);


// =========================================
// CANCEL WITHDRAWAL
// =========================================

router.post(
    "/:id/cancel",
    protect,
    cancelWithdrawal
);


module.exports = router;
