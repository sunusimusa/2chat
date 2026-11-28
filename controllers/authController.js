const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const Wallet = require("../models/Wallet");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

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


const sendEmailOtp = async (user) => {

    // GENERATE 6-DIGIT OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // HASH OTP
    const otpHash = crypto
        .createHash("sha256")
        .update(`${user._id}:${otp}`)
        .digest("hex");

    // SAVE OTP SECURITY DATA
    user.emailOtpHash = otpHash;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = new Date();

    await user.save();

    // SEND EMAIL
    const safeUsername = String(user.username)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    try {

        await sendEmail({
            to: user.email,
            subject: "Your 2Chat Verification Code",

            text:
                `Hello ${user.username},\n\n` +
                `Your 2Chat verification code is: ${otp}\n\n` +
                `This code expires in 10 minutes.\n\n` +
                `If you did not request this code, please ignore this email.`,

            html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:25px;color:#222;">
                    <h2 style="color:#0084ff;">Welcome to 2Chat!</h2>

                    <p>Hello ${safeUsername},</p>

                    <p>Use this verification code to verify your email address:</p>

                    <div style="background:#f1f5f9;padding:18px;text-align:center;border-radius:8px;">
                        <h1 style="letter-spacing:8px;color:#0084ff;margin:0;">
                            ${otp}
                        </h1>
                    </div>

                    <p>This code expires in <strong>10 minutes</strong>.</p>

                    <p>If you did not request this code, please ignore this email.</p>

                    <p>Thank you,<br><strong>2Chat Team</strong></p>
                </div>
            `
        });

    } catch (error) {

        // INVALIDATE OTP IF EMAIL DELIVERY FAILS
        user.emailOtpHash = null;
        user.emailOtpExpires = null;
        user.emailOtpAttempts = 0;
        user.emailOtpLastSentAt = null;

        await user.save();

        throw error;
    }
};
                      
// =====================================================
// REGISTER
// =====================================================

exports.register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      phoneNumber,
      dateOfBirth
    } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof phoneNumber !== "string" ||
      typeof dateOfBirth !== "string" ||
      !username.trim() ||
      !email.trim() ||
      !password ||
      !phoneNumber.trim() ||
      !dateOfBirth.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All registration fields are required."
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim();

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 30 ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,28}[a-zA-Z0-9]$/.test(cleanUsername)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid username. Use 3-30 characters."
      });
    }

    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    if (!/^\\+[1-9]\\d{7,14}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid international phone number."
      });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 128 characters."
      });
    }

    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(dateOfBirth)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid date of birth."
      });
    }

    const [year, month, day] = dateOfBirth.split("-").map(Number);
    const birthDate = new Date(Date.UTC(year, month - 1, day));

    if (
      birthDate.getUTCFullYear() !== year ||
      birthDate.getUTCMonth() !== month - 1 ||
      birthDate.getUTCDate() !== day
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date of birth."
      });
    }

    const today = new Date();
    const todayUTC = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    ));

    if (birthDate > todayUTC) {
      return res.status(400).json({
        success: false,
        message: "Date of birth cannot be in the future."
      });
    }

    let age = todayUTC.getUTCFullYear() - year;
    const birthdayNotReached =
      todayUTC.getUTCMonth() < month - 1 ||
      (todayUTC.getUTCMonth() === month - 1 && todayUTC.getUTCDate() < day);

    if (birthdayNotReached) age--;

    if (age < 13) {
      return res.status(403).json({
        success: false,
        message: "You must be at least 13 years old to use 2Chat."
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        { username: cleanUsername },
        { phoneNumber: cleanPhone }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email, username or phone number is already registered."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      dateOfBirth: birthDate,
      accountType: age < 18 ? "teen" : "adult",
      password: hashedPassword,
      emailVerified: false
    });

    // Create the user's wallet and sign them in immediately.
    await createWalletIfMissing(user._id);

    user.online = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id, user.tokenVersion || 0);
    const safeUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      accountType: user.accountType,
      role: user.role,
      isCreator: user.isCreator,
      creatorBadge: user.creatorBadge,
      favoriteCategories: user.favoriteCategories,
      avatar: user.avatar,
      cover: user.cover,
      bio: user.bio,
      online: user.online,
      lastSeen: user.lastSeen
    };

    return res.status(201).json({
      success: true,
      requiresEmailVerification: false,
      message: "Account created successfully.",
      token,
      user: safeUser
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email, username or phone number is already registered."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to complete registration. Please try again."
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
            phoneNumber,
            password
        } = req.body;

        // PASSWORD VALIDATION
        if (
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Password is required."
            });
        }

        // LOGIN IDENTIFIER
        const loginValue = String(
            email || phoneNumber || username || ""
        ).trim();

        if (!loginValue) {
            return res.status(400).json({
                success: false,
                message: "Email, phone number or username is required."
            });
        }

        // ESCAPE REGEX CHARACTERS
        const escapeRegex = value =>
            value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const loginConditions = [
            {
                email: {
                    $regex: "^" + escapeRegex(loginValue) + "$",
                    $options: "i"
                }
            },
            {
                username: {
                    $regex: "^" + escapeRegex(loginValue) + "$",
                    $options: "i"
                }
            },
            {
                phoneNumber: loginValue
            }
        ];

        // FIND USER
        const user = await User.findOne({
            $or: loginConditions
        }).select("+password +tokenVersion");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        // CHECK PASSWORD
        const match = await bcrypt.compare(
            password,
            user.password
        );

        if (!match) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials."
            });
        }

      
// Email verification is optional; registration and login do not require an OTP.

        // ACCOUNT SUSPENSION CHECK
        if (user.isSuspended) {
            if (
                user.suspendedUntil &&
                user.suspendedUntil <= new Date()
            ) {
                user.isSuspended = false;
                user.suspensionReason = "";
                user.suspendedUntil = null;
                user.suspendedBy = null;
            } else {
                return res.status(403).json({
                    success: false,
                    suspended: true,
                    message: "Your account has been suspended.",
                    reason: user.suspensionReason ||
                        "Community Guidelines violation",
                    suspendedUntil: user.suspendedUntil
                });
            }
        }

        // ONLINE STATUS
        user.online = true;
        user.lastSeen = new Date();

        await user.save();

        // LEGACY WALLET SUPPORT
        await createWalletIfMissing(user._id);

        // GENERATE TOKEN
        const token = generateToken(user._id, user.tokenVersion || 0);

        // SAFE USER RESPONSE
        const safeUser = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isCreator: user.isCreator,
            creatorBadge: user.creatorBadge,
            favoriteCategories: user.favoriteCategories,
            avatar: user.avatar,
            cover: user.cover,
            bio: user.bio,
            online: user.online,
            lastSeen: user.lastSeen
        };

        return res.json({
            success: true,
            token,
            user: safeUser,
            accountDeletionPending: Boolean(
                user.deletionScheduledFor
            ),
            deletionScheduledFor: user.deletionScheduledFor || null
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to log in."
        });
    }
};
      

// =====================================================
// UPDATE PROFILE
// =====================================================


exports.updateProfile = async (req, res) => {
    try {
        const { username, bio } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // USERNAME VALIDATION
        if (username !== undefined) {

            if (typeof username !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid username."
                });
            }

            const cleanUsername = username.trim();

            if (
                cleanUsername.length < 3 ||
                cleanUsername.length > 30 ||
                !/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,28}[a-zA-Z0-9]$/.test(cleanUsername)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Username must be 3-30 characters, use letters, numbers, dots, underscores or hyphens, and start and end with a letter or number."
                });
            }

            const existingUser = await User.findOne({
                username: {
                    $regex: "^" +
                        cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
                        "$",
                    $options: "i"
                },
                _id: { $ne: user._id }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Username is already taken."
                });
            }

            user.username = cleanUsername;
        }

        // BIO VALIDATION
        if (bio !== undefined) {

            if (
                typeof bio !== "string" ||
                bio.length > 500
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Bio must not exceed 500 characters."
                });
            }

            user.bio = bio.trim();
        }

        await user.save();

        return res.json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                _id: user._id,
                username: user.username,
                bio: user.bio,
                avatar: user.avatar,
                cover: user.cover
            }
        });

    } catch (err) {

        console.error("UPDATE PROFILE ERROR:", err);

        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Username is already taken."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update profile."
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
    message: "Unable to upload profile picture."
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
    message: "Unable to retrieve users."
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
    message: "Unable to retrieve user status."
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
    message: "Unable to upload cover photo."
});

  }

};


// =====================================================
// REGISTER FCM TOKEN
// =====================================================

exports.registerFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (
      typeof token !== "string" ||
      !token.trim() ||
      token.length > 4096
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid FCM token is required"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
  req.user._id,
  {
    $addToSet: {
      fcmTokens: token.trim()
    }
  },
  {
    new: true,
    runValidators: true
  }
);

if (!updatedUser) {
  return res.status(404).json({
    success: false,
    message: "User not found while registering FCM token."
  });
}

console.log("✅ FCM TOKEN SAVED:", {
  username: updatedUser.username,
  tokenCount: updatedUser.fcmTokens?.length || 0
});

    return res.json({
      success: true,
      message: "FCM token registered successfully"
    });

  } catch (err) {
    console.error("REGISTER FCM TOKEN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to register FCM token"
    });
  }
};


exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // VALIDATE INPUT
    if (
      typeof email !== "string" ||
      typeof otp !== "string" ||
      !email.trim() ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email and 6-digit verification code."
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // FIND USER AND LOAD PRIVATE OTP FIELDS
    const user = await User.findOne({
      email: cleanEmail
    }).select(
      "+emailOtpHash +emailOtpExpires +emailOtpAttempts +tokenVersion"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found."
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "This email address is already verified."
      });
    }

    if (!user.emailOtpHash || !user.emailOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "No active verification code. Please request a new code."
      });
    }

    // CHECK ATTEMPT LIMIT
    if (user.emailOtpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code."
      });
    }

    // CHECK EXPIRY
    if (user.emailOtpExpires.getTime() < Date.now()) {
      user.emailOtpHash = null;
      user.emailOtpExpires = null;
      user.emailOtpAttempts = 0;

      await user.save();

      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code."
      });
    }

    // HASH SUBMITTED OTP
    const submittedHash = crypto
      .createHash("sha256")
      .update(`${user._id}:${otp}`)
      .digest("hex");

    const storedHashBuffer = Buffer.from(user.emailOtpHash, "hex");
    const submittedHashBuffer = Buffer.from(submittedHash, "hex");

    const otpMatches =
      storedHashBuffer.length === submittedHashBuffer.length &&
      crypto.timingSafeEqual(
        storedHashBuffer,
        submittedHashBuffer
      );

    // WRONG OTP
    if (!otpMatches) {
      user.emailOtpAttempts += 1;

      if (user.emailOtpAttempts >= 5) {
        user.emailOtpHash = null;
        user.emailOtpExpires = null;
      }

      await user.save();

      return res.status(400).json({
        success: false,
        message: user.emailOtpAttempts >= 5
          ? "Too many incorrect attempts. Please request a new code."
          : "Incorrect verification code."
      });
    }

    // VERIFY EMAIL
    user.emailVerified = true;
    user.emailOtpHash = null;
    user.emailOtpExpires = null;
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = null;

    await user.save();

    // CREATE WALLET AFTER VERIFICATION
    await createWalletIfMissing(user._id);

    // GENERATE LOGIN TOKEN
    const token = generateToken(user._id, user.tokenVersion || 0);

    // SAFE USER RESPONSE
    const safeUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      accountType: user.accountType,
      role: user.role,
      isCreator: user.isCreator,
      creatorBadge: user.creatorBadge,
      favoriteCategories: user.favoriteCategories,
      avatar: user.avatar,
      cover: user.cover,
      bio: user.bio,
      online: user.online,
      lastSeen: user.lastSeen
    };

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      token,
      user: safeUser
    });

  } catch (err) {
    console.error("VERIFY EMAIL OTP ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify email. Please try again."
    });
  }
};
    

exports.resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // VALIDATE EMAIL
    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address."
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // FIND USER
    const user = await User.findOne({
      email: cleanEmail
    }).select("+emailOtpLastSentAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found."
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "This email address is already verified."
      });
    }

    // 60-SECOND RESEND COOLDOWN
    if (user.emailOtpLastSentAt) {
      const elapsed =
        Date.now() - user.emailOtpLastSentAt.getTime();

      const cooldown = 60 * 1000;

      if (elapsed < cooldown) {
        const retryAfterSeconds = Math.ceil(
          (cooldown - elapsed) / 1000
        );

        return res.status(429).json({
          success: false,
          retryAfterSeconds,
          message: `Please wait ${retryAfterSeconds} seconds before requesting another code.`
        });
      }
    }

    // SEND NEW OTP
    await sendEmailOtp(user);

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email."
    });

  } catch (err) {
    console.error("RESEND EMAIL OTP ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send verification code. Please try again."
    });
  }
};


// =====================================================
// 2CHAT RECOVERY KEY + BACKUP CODES
// =====================================================
const hashRecoveryCode = (userId, value) => crypto.createHash('sha256').update('2chat-recovery-v1:' + String(userId) + ':' + value).digest('hex');
const safeEqualHex = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string' || !/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  const a = Buffer.from(left, 'hex'); const b = Buffer.from(right, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const makeRecoveryCode = bytes => crypto.randomBytes(bytes).toString('hex').toUpperCase();

exports.createRecoveryCredentials = async (req, res) => {
  try {
    const currentPassword = req.body && req.body.currentPassword;
    if (typeof currentPassword !== 'string' || !currentPassword) return res.status(400).json({ success:false, message:'Enter your current password.' });
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success:false, message:'Account not found.' });
    if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ success:false, message:'Current password is incorrect.' });
    const recoveryKey = makeRecoveryCode(24);
    const backupCodes = Array.from({ length:5 }, () => makeRecoveryCode(8));
    user.recoveryKeyHash = hashRecoveryCode(user._id, recoveryKey);
    user.recoveryBackupCodeHashes = backupCodes.map(code => hashRecoveryCode(user._id, code));
    user.recoveryCredentialsCreatedAt = new Date();
    await user.save();
    return res.json({ success:true, message:'Save these recovery credentials now. They will not be shown again.', recoveryKey, backupCodes });
  } catch (err) { console.error('CREATE RECOVERY CREDENTIALS ERROR:', err); return res.status(500).json({ success:false, message:'Unable to create recovery credentials.' }); }
};

exports.resetPasswordWithRecovery = async (req, res) => {
  try {
    const { identifier, recoveryCode, newPassword } = req.body || {};
    if (typeof identifier !== 'string' || !identifier.trim() || typeof recoveryCode !== 'string' || !recoveryCode.trim() || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) return res.status(400).json({ success:false, message:'Enter your username or email, recovery code, and a password of 8-128 characters.' });
    const cleanIdentifier = identifier.trim();
    const user = await User.findOne({ $or:[ { email:cleanIdentifier.toLowerCase() }, { username:cleanIdentifier } ] }).select('+recoveryKeyHash +recoveryBackupCodeHashes');
    if (!user) return res.status(400).json({ success:false, message:'Account details or recovery code are incorrect.' });
    const normalizedCode = recoveryCode.trim().toUpperCase().replace(/[^A-F0-9]/g, '');
    if (!/^[A-F0-9]{16,48}$/.test(normalizedCode)) return res.status(400).json({ success:false, message:'Account details or recovery code are incorrect.' });
    const submittedHash = hashRecoveryCode(user._id, normalizedCode);
    const isRecoveryKey = safeEqualHex(user.recoveryKeyHash, submittedHash);
    const matchingBackupHash = (user.recoveryBackupCodeHashes || []).find(hash => safeEqualHex(hash, submittedHash));
    if (!isRecoveryKey && !matchingBackupHash) return res.status(400).json({ success:false, message:'Account details or recovery code are incorrect.' });
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const filter = { _id:user._id };
    const update = { $set:{ password:hashedPassword }, $inc:{ tokenVersion:1 } };
    if (isRecoveryKey) {
      filter.recoveryKeyHash = user.recoveryKeyHash;
      update.$set.recoveryKeyHash = null;
    } else {
      filter.recoveryBackupCodeHashes = matchingBackupHash;
      update.$pull = { recoveryBackupCodeHashes:matchingBackupHash };
    }
    const updated = await User.findOneAndUpdate(filter, update, { new:true });
    if (!updated) return res.status(409).json({ success:false, message:'This recovery code has just been used or changed. Try another code.' });
    return res.json({ success:true, message:'Password reset successfully. Sign in with your new password.' });
  } catch (err) { console.error('RECOVERY PASSWORD RESET ERROR:', err); return res.status(500).json({ success:false, message:'Unable to reset password. Please try again.' }); }
};