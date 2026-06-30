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

const upload = require("../middleware/upload");

router.post(
"/create",
upload.single("image"),
createPost
);

router.get("/", getPosts);

router.put("/like", likePost);

router.put("/comment", commentPost);

router.put("/edit", editPost);

router.delete("/delete", deletePost);

module.exports = router;
