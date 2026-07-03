const router =
require("express").Router();

const {
createPost,
getPosts,
getUserPosts,
likePost,
commentPost,
deletePost,
editPost
}
=
require("../controllers/postController");

const upload = require("../middleware/upload");

router.post(
"/create",
upload.single("image"),
createPost
);

router.get("/", getPosts);

router.get(
"/user/:username",
getUserPosts
);

router.get(
"/single/:id",
getSinglePost
);

router.put("/like", likePost);

router.put("/comment", commentPost);

router.put("/edit", editPost);

router.delete("/delete", deletePost);

module.exports = router;
