const router = require("express").Router();

const upload = require("../middleware/upload");

const {

    uploadVideo,
    getVideos,
    likeVideo,
    commentVideo,
    addView

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

module.exports = router;
