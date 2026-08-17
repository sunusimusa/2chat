const router = require("express").Router();

const protect = require("../middleware/auth");

const {
    getMonetizationStatus,
    applyForMonetization,
    testMakeEligible
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

router.post(
    "/test-make-eligible",
    protect,
    testMakeEligible
);

module.exports = router;
