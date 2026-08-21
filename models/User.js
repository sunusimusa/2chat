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

    password: {
      type: String,
      required: true
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
      type: [String],
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
  username: 1
});

userSchema.index({
  email: 1
});

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
