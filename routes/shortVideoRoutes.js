const router = require("express").Router();

const upload = require("../middleware/upload");

const protect = require("../middleware/auth");

const adminAuth = require("../middleware/adminAuth");

const {
    moderateShort,
    getPendingShorts
} = require("../controllers/shortModerationController");

const {
    uploadVideo,
    getVideos,
    likeVideo,
    commentVideo,
    addView,
    saveVideo,
    migrateLegacyShorts,
    getSavedVideos,
    getForYouVideos,
    addWatchTime,
    getTrendingVideos,
    addShare,
    getAnalytics,
    getAnalyticsChart,
    getTopVideos,
    getFollowersGrowth,
    getCreatorLevel,
    getCreatorBadge,
    searchShorts,
    getShortById,
    getUserShorts,
    editMyShort,
    deleteMyShort
} = require("../controllers/shortVideoController");

// Upload Short Video
router.post(
    "/upload",
    protect,
    upload.single("video"),
    uploadVideo
);

router.post(
    "/admin/migrate-legacy",
    protect,
    adminAuth,
    migrateLegacyShorts
);

// Admin: Moderate Short Video
router.put(
    "/admin/moderate/:id",
    protect,
    adminAuth,
    moderateShort
);

// Admin: Get Pending Shorts
router.get(
    "/admin/pending",
    protect,
    adminAuth,
    getPendingShorts
);

// Get All Videos
router.get("/all", getVideos);

// Like
router.put("/like", protect, likeVideo);

router.put("/comment", protect, commentVideo);

// View
router.put("/view/:id", protect, addView);

router.put("/share/:id", protect, addShare);

// Save / Unsave Video
router.put("/save", protect, saveVideo);

router.get("/saved", protect, getSavedVideos);

router.get("/foryou", protect, getForYouVideos);

router.put("/watch/:id", protect, addWatchTime);

router.get("/trending", getTrendingVideos);

router.get("/analytics", protect, getAnalytics);

router.get("/analytics-chart", protect, getAnalyticsChart);

router.get(
    "/analytics/top",
    protect,
    getTopVideos
);

router.get(
    "/analytics/followers",
    protect,
    getFollowersGrowth
);

router.get(
    "/analytics/level",
    protect,
    getCreatorLevel
);

router.get(
    "/creator-badge",
    protect,
    getCreatorBadge
);

router.get(
"/search/:keyword",
searchShorts
);

// Get Single Short by ID
router.get("/video/:id",getShortById);

// Get public Shorts by profile username
router.get(
    "/user/:username",
    getUserShorts
);

// Edit My Short
router.put("/:id", protect, editMyShort);

// Delete My Short
router.delete("/:id", protect, deleteMyShort);

module.exports = router;
