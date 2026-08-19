const express = require("express");

const router = express.Router();


// =========================================
// MIDDLEWARE
// =========================================

const protect = require("../middleware/auth");

const adminAuth = require("../middleware/adminAuth");


// =========================================
// CONTROLLER
// =========================================

const {

    getMonetizationApplications,

    getMonetizationApplication,

    approveMonetization,

    rejectMonetization,

    suspendMonetization,

    restoreMonetization

} = require("../controllers/adminMonetizationController");


// =====================================================
// ADMIN MONETIZATION ROUTES
// =====================================================

// Duk routes ɗin da ke ƙasa:
// 1. User dole ya kasance logged in
// 2. User ɗin dole ya kasance admin


// =========================================
// GET ALL APPLICATIONS
// =========================================

router.get(
    "/applications",
    protect,
    adminAuth,
    getMonetizationApplications
);


// =========================================
// GET SINGLE APPLICATION
// =========================================

router.get(
    "/applications/:userId",
    protect,
    adminAuth,
    getMonetizationApplication
);


// =========================================
// APPROVE APPLICATION
// =========================================

router.put(
    "/applications/:userId/approve",
    protect,
    adminAuth,
    approveMonetization
);


// =========================================
// REJECT APPLICATION
// =========================================

router.put(
    "/applications/:userId/reject",
    protect,
    adminAuth,
    rejectMonetization
);


// =========================================
// SUSPEND MONETIZATION
// =========================================

router.put(
    "/applications/:userId/suspend",
    protect,
    adminAuth,
    suspendMonetization
);


// =========================================
// RESTORE MONETIZATION
// =========================================

router.put(
    "/applications/:userId/restore",
    protect,
    adminAuth,
    restoreMonetization
);


// =========================================
// EXPORT
// =========================================

module.exports = router;
