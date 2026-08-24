const express =
    require("express");

const router =
    express.Router();


const {
    getCoinPackages
} =
    require("../controllers/coinPackageController");


// =====================================================
// GET ACTIVE COIN PACKAGES
// =====================================================
//
// GET /api/coin-packages
//
// Ba ya buƙatar login domin Buy Coins page ta iya
// nuna packages.
// =====================================================

router.get(
    "/",
    getCoinPackages
);


// =====================================================
// EXPORT
// =====================================================

module.exports =
    router;
