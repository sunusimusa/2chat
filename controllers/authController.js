const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const cloudinary =
require("../services/cloudinary");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {

    const { email, username, bio } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success:false,
        message:"User not found"
      });
    }

    user.username = username || user.username;
    user.bio = bio || user.bio;

    await user.save();

    res.json({
      success:true,
      user
    });

  } catch(err) {

    res.status(500).json({
      success:false,
      message:err.message
    });

  }
};

exports.uploadAvatar =
async (req,res)=>{

try{

const User =
require("../models/User");

const {
email
} = req.body;

const user =
await User.findOne({ email });

if(!user){

return res.status(404).json({
success:false,
message:"User not found"
});

}

const result =
await cloudinary.uploader.upload(
req.file.path,
{
folder:"2chat-avatar"
}
);

user.avatar =
result.secure_url;

await user.save();

res.json({
success:true,
avatar:user.avatar
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};
