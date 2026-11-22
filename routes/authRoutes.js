const router = require("express").Router();

const { rateLimit } = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later."
  }
});

const protect = require("../middleware/auth");

const {
    profileUpload,
    validateProfileImage
} = require("../middleware/profileUpload");

const {
register,
login,
verifyEmailOtp,
resendEmailOtp,
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
router.post("/register",
authLimiter, register);

// Login
router.post("/login",
authLimiter, login);

// Verify Email OTP
router.post(
  "/verify-email-otp",
  authLimiter,
  verifyEmailOtp
);

// Resend Email OTP
router.post(
  "/resend-email-otp",
  authLimiter,
  resendEmailOtp
);

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
