const router = require("express").Router();

const {
  register,
  login
} = require("../controllers/authController");

router.get("/", (req, res) => {
  res.send("✅ Auth API Working");
});

router.post("/register", register);
router.post("/login", login);

module.exports = router;

router.get("/test-user", async (req, res) => {
  const User = require("../models/User");

  const count = await User.countDocuments();

  res.json({
    success: true,
    users: count
  });
});
