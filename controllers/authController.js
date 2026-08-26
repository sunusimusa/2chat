const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const Wallet = require("../models/Wallet");

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

await Wallet.findOneAndUpdate(
  { userId: user._id },
  {
    $setOnInsert: {
      userId: user._id,
      coins: 0,
      totalPurchased: 0,
      totalSpent: 0,
      totalEarned: 0,
      platformCommission: 0,
      availableBalance: 0,
      withdrawalLockedBalance: 0,
      totalWithdrawn: 0,
      giftsSent: 0,
      giftsReceived: 0
    }
  },
  {
    upsert: true,
    new: true
  }
);

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
// LOGIN
exports.login = async (req, res) => {

  try {

    const {
      email,
      username,
      password
    } = req.body;


    if (!password) {

      return res.status(400).json({
        success: false,
        message: "Password is required"
      });

    }


    // Login da email KO username
    const loginValue =
      email || username;


    if (!loginValue) {

      return res.status(400).json({
        success: false,
        message: "Email or username is required"
      });

    }


    const user =
      await User.findOne({
        $or: [
          { email: loginValue },
          { username: loginValue }
        ]
      });


    if (!user) {

      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });

    }


    const match =
      await bcrypt.compare(
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


    return res.json({

      success: true,

      token:
        generateToken(user._id),

      user

    });


  } catch (err) {

    console.error(
      "LOGIN ERROR:",
      err
    );

    return res.status(500).json({

      success: false,

      message:
        err.message

    });

  }

};

exports.updateProfile = async (req, res) => {
  try {

    const { username, bio } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (username) {
      user.username = username;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    await user.save();

    res.json({
      success: true,
      user
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.uploadAvatar = async (req, res) => {

    try {

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image selected"
            });
        }

        const result =
            await new Promise((resolve, reject) => {

                const stream =
                    cloudinary.uploader.upload_stream(
                        {
                            folder: "2chat-avatar",
                            resource_type: "image"
                        },
                        (error, result) => {

                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }

                        }
                    );

                streamifier
                    .createReadStream(req.file.buffer)
                    .pipe(stream);

            });


        user.avatar = result.secure_url;

        await user.save();


        res.json({
            success: true,
            avatar: user.avatar
        });


    } catch (err) {

        console.error(
            "UPLOAD AVATAR ERROR:",
            err
        );

        res.status(500).json({
            success: false,
            message: err.message
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

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image selected"
            });
        }


        const result =
            await new Promise((resolve, reject) => {

                const stream =
                    cloudinary.uploader.upload_stream(
                        {
                            folder: "2chat/covers",
                            resource_type: "image"
                        },
                        (error, result) => {

                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }

                        }
                    );


                streamifier
                    .createReadStream(req.file.buffer)
                    .pipe(stream);

            });


        user.cover = result.secure_url;

        await user.save();


        res.json({
            success: true,
            cover: user.cover
        });


    } catch (err) {

        console.error(
            "UPLOAD COVER ERROR:",
            err
        );

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};
