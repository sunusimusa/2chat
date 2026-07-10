const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const cloudinary = require("../config/cloudinary");

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

    user.online = true;
    user.lastSeen = new Date();

    await user.save();

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

// GET ALL USERS

exports.getUsers = async (req,res)=>{

try{

const users =
await User.find(
{},
"username avatar bio"
);

res.json({
success:true,
users
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

exports.getStatus = async(req,res)=>{

try{

const user =
await User.findOne({
username:req.params.username
});

res.json({
online:user.online,
lastSeen:user.lastSeen
});

}catch(err){

res.status(500).json({
message:err.message
});

}

};

exports.uploadCover = async (req, res) => {

try {

const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const file = req.file;

if (!file) {
return res.json({
success:false,
message:"No image selected"
});
}

const result = await cloudinary.uploader.upload(file.path,{
folder:"2chat/covers"
});

const user = await User.findOneAndUpdate(
{ email:req.body.email },
{ cover:result.secure_url },
{ new:true }
);

res.json({
success:true,
cover:user.cover
});

} catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};
