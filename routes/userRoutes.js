const router = require("express").Router();

const {
    followUser,
    getUserProfile,
    getAllUsers
} = require("../controllers/userController");


// ==========================
// FOLLOW USER
// ==========================

router.put(
    "/follow",
    followUser
);


// ==========================
// GET USER PROFILE
// ==========================

router.get(
    "/profile/:username",
    getUserProfile
);


// ==========================
// GET ALL USERS
// ==========================

router.get(
    "/all",
    getAllUsers
);


module.exports = router;
