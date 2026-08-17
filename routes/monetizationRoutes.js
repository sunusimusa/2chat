const router = require("express").Router();

const protect =
    require("../middleware/auth");

const {
    getMonetizationStatus
} =
    require("../controllers/monetizationController");


// =========================================
// GET CREATOR MONETIZATION STATUS
// =========================================

router.get(
    "/status",
    protect,
    getMonetizationStatus
);


module.exports = router;
