const router = require("express").Router();

const protect = require("../middleware/auth");

const {
    createWithdrawal
} = require("../controllers/withdrawalController");


// =========================================
// CREATE WITHDRAWAL REQUEST
// =========================================

router.post(
    "/",
    protect,
    createWithdrawal
);


module.exports = router;
