const router = require("express").Router();

const protect = require("../middleware/auth");

const {
    getMonetizationStatus,
    applyForMonetization
} = require("../controllers/monetizationController");


// =========================================
// CREATOR MONETIZATION STATUS
// =========================================

router.get(
    "/status",
    protect,
    getMonetizationStatus
);


router.post(
    "/apply",
    protect,
    applyForMonetization
);

module.exports = router;
