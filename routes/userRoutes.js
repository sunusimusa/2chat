const router = require("express").Router();

const protect = require("../middleware/auth");

const {
    followUser,
    getUserProfile,
    getAllUsers,
    searchUsers,
    blockUser,
    unblockUser,
    getBlockedUsers
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
    protect,
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

    
// =========================================
// BLOCK / UNBLOCK USER
// =========================================

router.post(
    "/block/:userId",
    protect,
    blockUser
);

router.delete(
    "/block/:userId",
    protect,
    unblockUser
);

router.get(
    "/blocked",
    protect,
    getBlockedUsers
);

module.exports = router;
