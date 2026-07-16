const router = require("express").Router();

const upload = require("../middleware/upload");

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
    upload.single("video"),
    uploadVideo
);

// Get All Videos
router.get("/all", getVideos);

// Like
router.put("/like", likeVideo);

// Comment
router.put("/comment", commentVideo);

// View
router.put("/view/:id", addView);

router.put("/share/:id", addShare);

// Save / Unsave Video
router.put("/save", saveVideo);

router.get("/saved/:username", getSavedVideos);

router.get("/foryou/:username", getForYouVideos);

router.put("/watch/:id", addWatchTime);

router.get("/trending", getTrendingVideos);

router.get("/analytics/:username", getAnalytics);

router.get("/analytics-chart/:username", getAnalyticsChart);

router.get(
    "/analytics/top/:username",
    getTopVideos
);

router.get(
"/analytics/followers/:username",
getFollowersGrowth
);

router.get(
"/analytics/level/:username",
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
