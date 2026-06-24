const router =
require("express").Router();

const {
createPost,
getPosts,
likePost,
commentPost,
deletePost,
editPost
}
=
require("../controllers/postController");

router.post("/create", createPost);

router.get("/", getPosts);

router.put("/like", likePost);

router.put("/comment", commentPost);

router.put("/edit", editPost);

router.delete("/delete", deletePost);

module.exports = router;
