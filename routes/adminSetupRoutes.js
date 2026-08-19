const express = require("express");

const router = express.Router();

const {
    setupAdmin
} = require("../controllers/adminSetupController");


// =========================================
// ONE-TIME ADMIN SETUP
// =========================================

router.post(
    "/setup",
    setupAdmin
);


module.exports = router;
