const router = require("express").Router();

const upload = require("../middleware/upload");

const protect = require("../middleware/auth");

const {
    uploadVideo,
    getVideos,
    likeVideo,
    commentVideo,
    addView,
    saveVideo,
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
    searchShorts
} = require("../controllers/shortVideoController");

// Upload Short Video
router.post(
    "/upload",
    protect,
    upload.single("video"),
    uploadVideo
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
"/creator-badge/:username",
getCreatorBadge
);

router.get(
"/search/:keyword",
searchShorts
);

module.exports = router;
