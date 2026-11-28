const router = require("express").Router();
const { rateLimit } = require("express-rate-limit");

const deletionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many account deletion attempts. Please try again later."
    }
});

const protect = require("../middleware/auth");

const {
    requestAccountDeletion,
    cancelAccountDeletion
} = require("../controllers/accountDeletionController");

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
// ACCOUNT DELETION
// =========================================

router.post("/delete-account", deletionLimiter, protect, requestAccountDeletion);
router.post("/cancel-deletion", protect, cancelAccountDeletion);

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
    protect,
    searchUsers
);


// =========================================
// GET ALL USERS
// =========================================

router.get(
    "/all",
    protect,
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
