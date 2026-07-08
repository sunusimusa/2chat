const router = require("express").Router();

const {
followUser,
getUserProfile,
getAllUsers
} = require("../controllers/userController");

router.put(
"/follow",
followUser
);

router.get(
"/profile/:username",
getUserProfile
);

router.get("/all", getAllUsers);

module.exports = router;
