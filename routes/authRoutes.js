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

router.get("/create-test-user", async (req, res) => {
  const User = require("../models/User");
  const bcrypt = require("bcryptjs");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await User.create({
    username: "sunusi",
    email: "sunusi@gmail.com",
    password: hashedPassword
  });

  res.json(user);
});

const {
  register,
  login,
  updateProfile
} = require("../controllers/authController");

router.put("/profile", updateProfile);
