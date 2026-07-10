const router = require("express").Router();

const {

    uploadVideo,
    getVideos,
    likeVideo,
    commentVideo,
    addView

} = require("../controllers/shortVideoController");


// Upload Video
router.post("/upload", uploadVideo);

// Get All Videos
router.get("/all", getVideos);

// Like Video
router.put("/like", likeVideo);

// Comment
router.put("/comment", commentVideo);

// Add View
router.put("/view/:id", addView);

module.exports = router;
