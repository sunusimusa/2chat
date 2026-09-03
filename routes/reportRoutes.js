const express = require("express");

const protect =
    require("../middleware/auth");

const adminAuth =
    require("../middleware/adminAuth");

const {
    createReport,
    getReports,
    updateReport
} =
    require("../controllers/reportController");


const router =
    express.Router();


// =====================================================
// USER REPORT
// =====================================================
//
// Logged-in users can submit reports.
//
// POST /api/reports
//
// =====================================================

router.post(
    "/",
    protect,
    createReport
);


// =====================================================
// ADMIN GET REPORTS
// =====================================================
//
// GET /api/reports
//
// Admin only.
//
// =====================================================

router.get(
    "/",
    protect,
    adminAuth,
    getReports
);


// =====================================================
// ADMIN UPDATE REPORT
// =====================================================
//
// PUT /api/reports/:id
//
// Admin only.
//
// =====================================================

router.put(
    "/:id",
    protect,
    adminAuth,
    updateReport
);


module.exports =
    router;
