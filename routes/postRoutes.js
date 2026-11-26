const router = require("express").Router();

const {
    createPost,
    getPosts,
    likePost,
    commentPost,
    replyToComment,
    editPost,
    deletePost,
    getUserPosts,
    getSinglePost
} = require("../controllers/postController");

const upload = require("../middleware/upload");
const protect = require("../middleware/auth");

// PROTECTED ROUTES

router.post(
    "/create",
    protect,
    upload.single("file"),
    createPost
);

router.put("/like", protect, likePost);

router.put("/comment", protect, commentPost);

router.put("/reply", protect, replyToComment);

router.put("/edit", protect, editPost);

router.delete("/delete", protect, deletePost);

// PUBLIC ROUTES

router.get("/", getPosts);

router.get(
    "/user/:username",
    getUserPosts
);

router.get(
    "/single/:id",
    getSinglePost
);

module.exports = router;
    
