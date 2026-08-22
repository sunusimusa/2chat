const express = require("express");

const router =
    express.Router();

const {
    getCoinPackages
} = require("../controllers/coinPackageController");


// =========================================
// GET COIN PACKAGES
// =========================================

router.get(
    "/",
    getCoinPackages
);


module.exports = router;
