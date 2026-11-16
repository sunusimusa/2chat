const router = require("express").Router();

const protect = require("../middleware/auth");

const {
    profileUpload,
    validateProfileImage
} = require("../middleware/profileUpload");

const {
register,
login,
updateProfile,
uploadAvatar,
uploadCover,
getUsers,
getStatus,
registerFcmToken
} = require("../controllers/authController");

// Test
router.get("/", (req, res) => {
  res.send("✅ Auth API Working");
});

// Register
router.post("/register", register);

// Login
router.post("/login", login);

router.post(
  "/fcm-token",
  (req, res, next) => {
    console.log("🔥 FCM TOKEN ROUTE HIT");
    next();
  },
  protect,
  registerFcmToken
);

// Update Profile
router.put(
    "/profile",
    protect,
    updateProfile
);

// Upload Avatar
router.post(
    "/avatar",
    protect,
    profileUpload.single("avatar"),
    validateProfileImage,
    uploadAvatar
);

// Upload Cover
router.post(
    "/cover",
    protect,
    profileUpload.single("cover"),
    validateProfileImage,
    uploadCover
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
