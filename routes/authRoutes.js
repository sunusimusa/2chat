const router = require("express").Router();

const {
  register,
  login
} = require("../controllers/authController");

// TEST
router.get("/", (req, res) => {
  res.send("Auth API Working");
});

// REGISTER
router.post("/register", register);

// LOGIN
router.post("/login", login);

module.exports = router;
