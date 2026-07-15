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
    getForYouVideos
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

// Save / Unsave Video
router.put("/save", saveVideo);

router.get("/saved/:username", getSavedVideos);

router.get("/foryou/:username", getForYouVideos);

module.exports = router;
