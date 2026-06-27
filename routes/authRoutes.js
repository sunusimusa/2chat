const router = require("express").Router();

const upload =
require("../middleware/upload");

const {
register,
login,
updateProfile,
uploadAvatar,
getStatus
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

// Upload Avatar
router.post(
  "/avatar",
  upload.single("avatar"),
  uploadAvatar
);

router.get(
"/users",
getUsers
);

router.get(
"/status/:username",
getStatus
);

// User Count Test
router.get("/test-user", async (req, res) => {

  const User =
  require("../models/User");

  const count =
  await User.countDocuments();

  res.json({
    success: true,
    users: count
  });

});

module.exports = router;
