const router = require("express").Router();

const {
  register,
  login,
  updateProfile
} = require("../controllers/authController");

// Test
router.get("/", (req, res) => {
  res.send("✅ Auth API Working");
});

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Update Profile
router.put("/profile", updateProfile);

// User Count Test
router.get("/test-user", async (req, res) => {
  const User = require("../models/User");

  const count = await User.countDocuments();

  res.json({
    success: true,
    users: count
  });
});

module.exports = router;
