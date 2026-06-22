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

module.exports = router;
