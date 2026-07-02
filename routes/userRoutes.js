const router = require("express").Router();

const {
followUser,
getUserProfile
} = require("../controllers/userController");

router.put(
"/follow",
followUser
);

router.get(
"/profile/:username",
getUserProfile
);

module.exports = router;
