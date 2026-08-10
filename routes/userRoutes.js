const router = require("express").Router();

const {
    followUser,
    getUserProfile,
    getAllUsers,
    searchUsers
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
// SEARCH USERS
// ==========================

router.get(
    "/search/:keyword",
    searchUsers
);

// ==========================
// GET ALL USERS
// ==========================

router.get(
    "/all",
    getAllUsers
);


module.exports = router;
