const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {

    // =========================================
    // BASIC USER INFORMATION
    // =========================================

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },

    
    // =========================================
    // EMAIL VERIFICATION / OTP
    // =========================================

    emailVerified: {
      type: Boolean,
      default: true
    },

    emailOtpHash: {
      type: String,
      default: null,
      select: false
    },

    emailOtpExpires: {
      type: Date,
      default: null,
      select: false
    },

    emailOtpAttempts: {
      type: Number,
      default: 0,
      select: false
    },

    emailOtpLastSentAt: {
      type: Date,
      default: null,
      select: false
    },
    

    // =========================================
// PHONE NUMBER
// =========================================

phoneNumber: {
  type: String,
  trim: true,
  unique: true,
  sparse: true
},

// =========================================
// DATE OF BIRTH
// =========================================

dateOfBirth: {
  type: Date,
  default: null
},

// =========================================
// ACCOUNT AGE CATEGORY
// =========================================

accountType: {
  type: String,
  enum: ["teen", "adult"],
  default: null
},

      password: {
      type: String,
      required: true,
      select: false
    },

    // Optional recovery fields; legacy accounts remain unchanged.
    recoveryKeyHash: { type:String, default:null, select:false },
    recoveryBackupCodeHashes: { type:[String], default:[], select:false },
    recoveryCredentialsCreatedAt: { type:Date, default:null, select:false },
    tokenVersion: { type:Number, default:0, min:0, select:false },

    // =========================================
    // ACCOUNT DELETION
    // =========================================

    deletionRequestedAt: {
      type: Date,
      default: null,
      index: true
    },

    deletionScheduledFor: {
      type: Date,
      default: null,
      index: true
    },

    deletionAttempts: {
      type: Number,
      default: 0,
      min: 0
    },

    deletionLastAttemptAt: {
      type: Date,
      default: null
    },

    // =========================================
    // ACCOUNT ROLE
    // =========================================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true
    },


    
// =========================================
// ACCOUNT SUSPENSION / MODERATION
// =========================================

isSuspended: {
    type: Boolean,
    default: false,
    index: true
},

suspensionReason: {
    type: String,
    default: "",
    maxlength: 1000
},

suspendedUntil: {
    type: Date,
    default: null
},

suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
},

moderationWarnings: [{
    reason: {
        type: String,
        required: true,
        maxlength: 1000
    },
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
        default: null
    },
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    acknowledgedAt: {
        type: Date,
        default: null
    }
}],
    
    // =========================================
    // CREATOR SYSTEM
    // =========================================

    isCreator: {
      type: Boolean,
      default: false,
      index: true
    },

    creatorBadge: {
      type: String,
      default: "🥉 Bronze Creator"
    },

    favoriteCategories: {
      type: [String],
      default: []
    },


    // =========================================
    // PROFILE
    // =========================================

    avatar: {
      type: String,
      default: "/images/default.png"
    },

    cover: {
      type: String,
      default: "/images/default-cover.jpg"
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500
    },


    // =========================================
    // ONLINE STATUS
    // =========================================

    online: {
      type: Boolean,
      default: false
    },

    lastSeen: {
      type: Date,
      default: Date.now
    },


    // =========================================
    // FRIENDS
    // =========================================

    friends: {
      type: [String],
      default: []
    },


    // =========================================
    // FOLLOW SYSTEM
    // =========================================

    followers: {
      type: [String],
      default: []
    },

    following: {
      type: [String],
      default: []
    },

    fcmTokens: {
    type: [String],
    default: [],
    select: false
  },

    notificationsEnabled: {
    type: Boolean,
    default: true
  },

    // =========================================
    // SAVED SHORT VIDEOS
    // =========================================

    savedVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShortVideo"
      }
    ],


    // =========================================
    // BLOCKED USERS
    // =========================================

blockedUsers: {
    type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    default: []
      }

  },

  {
    timestamps: true
  }
);


// =========================================
// INDEXES
// =========================================

userSchema.index({
  isCreator: 1
});


// =========================================
// EXPORT
// =========================================

module.exports = mongoose.model(
  "User",
  userSchema
);
