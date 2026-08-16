const router = require("express").Router();

const protect = require("../middleware/auth");

const {
    createWithdrawal,
    getWithdrawalHistory,
    getWithdrawalById
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


module.exports = router;
