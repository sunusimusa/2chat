const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const Wallet = require("../models/Wallet");

// =====================================================
// WALLET DEFAULT DATA
// =====================================================

const createWalletIfMissing = async (userId) => {

  if (!userId) {
    throw new Error("User ID is required for wallet.");
  }

  return Wallet.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
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
};


// =====================================================
// REGISTER
// =====================================================

exports.register = async (req, res) => {

  try {

    const {
      username,
      email,
      password
    } = req.body;


    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (!username || !email || !password) {

      return res.status(400).json({
        success: false,
        message: "Username, email and password are required"
      });

    }


    // =========================================
    // CHECK EXISTING USER
    // =========================================

    const userExists =
      await User.findOne({
        $or: [
          { email },
          { username }
        ]
      });


    if (userExists) {

      return res.status(400).json({
        success: false,
        message: "User already exists"
      });

    }


    // =========================================
    // HASH PASSWORD
    // =========================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );


    // =========================================
    // CREATE USER
    // =========================================

    const user =
      await User.create({
        username,
        email,
        password: hashedPassword
      });


    // =========================================
    // CREATE WALLET
    // =========================================

    await createWalletIfMissing(
      user._id
    );


    // =========================================
    // TOKEN
    // =========================================

    const token =
      generateToken(
        user._id
      );


    // =========================================
    // RESPONSE
    // =========================================

    return res.status(201).json({

      success: true,

      token,

      user

    });


  } catch (err) {

    console.error(
      "REGISTER ERROR:",
      err
    );


    return res.status(500).json({

      success: false,

      message:
        err.message

    });

  }

};


// =====================================================
// LOGIN
// =====================================================

exports.login = async (req, res) => {

  try {

    const {
      email,
      username,
      password
    } = req.body;


    // =========================================
    // PASSWORD
    // =========================================

    if (!password) {

      return res.status(400).json({
        success: false,
        message: "Password is required"
      });

    }


    // =========================================
    // LOGIN VALUE
    // =========================================

    const loginValue =
      email || username;


    if (!loginValue) {

      return res.status(400).json({
        success: false,
        message: "Email or username is required"
      });

    }


    // =========================================
    // FIND USER
    // =========================================

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


    // =========================================
    // CHECK PASSWORD
    // =========================================

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


    // =========================================
    // ONLINE STATUS
    // =========================================

    user.online =
      true;

    user.lastSeen =
      new Date();


    await user.save();


    // =========================================
    // LEGACY WALLET SUPPORT
    // =========================================
    //
    // Idan tsohon user ba shi da Wallet,
    // za a ƙirƙira masa automatically.
    //
    // Idan Wallet yana nan, ba za a sake
    // ƙirƙirar wani ba.
    //

    await createWalletIfMissing(
      user._id
    );


    // =========================================
    // TOKEN
    // =========================================

    const token =
      generateToken(
        user._id
      );


    // =========================================
    // RESPONSE
    // =========================================

    return res.json({

      success: true,

      token,

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


// =====================================================
// UPDATE PROFILE
// =====================================================

exports.updateProfile = async (
  req,
  res
) => {

  try {

    const {
      username,
      bio
    } = req.body;


    const user =
      await User.findById(
        req.user._id
      );


    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found"
      });

    }


    // =========================================
    // USERNAME
    // =========================================

    if (username) {

      const existingUser =
        await User.findOne({
          username,
          _id: {
            $ne: req.user._id
          }
        });


      if (existingUser) {

        return res.status(400).json({
          success: false,
          message: "Username is already taken"
        });

      }


      user.username =
        username.trim();

    }


    // =========================================
    // BIO
    // =========================================

    if (bio !== undefined) {

      user.bio =
        String(
          bio
        ).trim();

    }


    await user.save();


    return res.json({

      success: true,

      user

    });


  } catch (err) {

    console.error(
      "UPDATE PROFILE ERROR:",
      err
    );


    return res.status(500).json({

      success: false,

      message:
        err.message

    });

  }

};


// =====================================================
// UPLOAD AVATAR
// =====================================================

exports.uploadAvatar = async (
  req,
  res
) => {

  try {

    const user =
      await User.findById(
        req.user._id
      );


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


    // =========================================
    // CLOUDINARY UPLOAD
    // =========================================

    const result =
      await new Promise(
        (resolve, reject) => {

          const stream =
            cloudinary
              .uploader
              .upload_stream(
                {
                  folder:
                    "2chat-avatar",

                  resource_type:
                    "image"
                },

                (
                  error,
                  result
                ) => {

                  if (error) {

                    reject(
                      error
                    );

                  } else {

                    resolve(
                      result
                    );

                  }

                }
              );


          streamifier
            .createReadStream(
              req.file.buffer
            )
            .pipe(
              stream
            );

        }
      );


    if (!result?.secure_url) {

      throw new Error(
        "Cloudinary did not return an image URL."
      );

    }


    // =========================================
    // SAVE AVATAR
    // =========================================

    user.avatar =
      result.secure_url;


    await user.save();


    return res.json({

      success: true,

      avatar:
        user.avatar

    });


  } catch (err) {

    console.error(
      "UPLOAD AVATAR ERROR:",
      err
    );


    return res.status(500).json({

      success: false,

      message:
        err.message

    });

  }

};


// =====================================================
// GET ALL USERS
// =====================================================

exports.getUsers = async (
  req,
  res
) => {

  try {

    const users =
      await User.find(
        {},
        "username avatar bio"
      );


    return res.json({

      success: true,

      users

    });


  } catch (err) {

    console.error(
      "GET USERS ERROR:",
      err
    );


    return res.status(500).json({

      success: false,

      message:
        err.message

    });

  }

};


// =====================================================
// GET USER ONLINE STATUS
// =====================================================

exports.getStatus = async (
  req,
  res
) => {

  try {

    const user =
      await User.findOne({
        username:
          req.params.username
      });


    if (!user) {

      return res.status(404).json({

        success: false,

        message:
          "User not found"

      });

    }


    return res.json({

      success: true,

      online:
        user.online,

      lastSeen:
        user.lastSeen

    });


  } catch (err) {

    console.error(
      "GET STATUS ERROR:",
      err
    );


    return res.status(500).json({

      success: false,

      message:
        err.message

    });

  }

};


// =====================================================
// UPLOAD COVER
// =====================================================

exports.uploadCover = async (
  req,
  res
) => {

  try {

    const user =
      await User.findById(
        req.user._id
      );


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


    // =========================================
    // CLOUDINARY UPLOAD
    // =========================================

    const result =
      await new Promise(
        (resolve, reject) => {

          const stream =
            cloudinary
              .uploader
              .upload_stream(
                {
                  folder:
                    "2chat/covers",

                  resource_type:
                    "image"
                },

                (
                  error,
                  result
                ) => {

                  if (error) {

                    reject(
                      error
                    );

                  } else {

                    resolve(
                      result
                    );

                  }

                }
              );


          streamifier
            .createReadStream(
              req.file.buffer
            )
            .pipe(
              stream
            );

        }
      );


    if (!result?.secure_url) {

      throw new Error(
        "Cloudinary did not return a cover URL."
      );

    }


    // =========================================
    // SAVE COVER
    // =========================================

    user.cover =
      result.secure_url;


    await user.save();


    return res.json({

      success: true,

      cover:
        user.cover

    });


  } catch (err) {

    console.error(
      "UPLOAD COVER ERROR:",
      err
    );


    return res.status(500).json({

      success: false,

      message:
        err.message

    });

  }

};
