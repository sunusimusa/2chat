const router = require("express").Router();

const {
followUser
} = require("../controllers/userController");

router.put(
"/follow",
followUser
);

module.exports = router;
