const router = require("express").Router();

const protect = require("../middleware/auth");

const {
    followUser,
    getUserProfile,
    getAllUsers,
    searchUsers
} = require("../controllers/userController");


// =========================================
// FOLLOW / UNFOLLOW USER
// =========================================

router.put(
    "/follow",
    protect,
    followUser
);


// =========================================
// GET USER PROFILE
// =========================================

router.get(
    "/profile/:username",
    getUserProfile
);


// =========================================
// SEARCH USERS
// =========================================

router.get(
    "/search/:keyword",
    searchUsers
);


// =========================================
// GET ALL USERS
// =========================================

router.get(
    "/all",
    getAllUsers
);


module.exports = router;
