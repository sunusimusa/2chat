const {
createPost,
getPosts,
likePost,
commentPost
}
=
require("../controllers/postController");
const router =
require("express").Router();

const {
createPost,
getPosts,
likePost
}
=
require("../controllers/postController");

router.post("/create", createPost);

router.get("/", getPosts);

router.put("/like", likePost);

router.put("/comment", commentPost);

module.exports = router;
