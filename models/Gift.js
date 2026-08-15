const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema(
  {
    // =========================================
    // SENDER
    // =========================================

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // =========================================
    // RECEIVER / CREATOR
    // =========================================

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // =========================================
    // GIFT TYPE
    // =========================================

    giftType: {
      type: String,
      required: true,
      trim: true
    },

    // =========================================
    // COINS SPENT
    // =========================================

    coins: {
      type: Number,
      required: true,
      min: 1
    },

    // =========================================
    // GROSS VALUE (₦)
    // =========================================

    grossAmount: {
      type: Number,
      required: true,
      min: 0
    },

    // =========================================
    // PLATFORM COMMISSION (₦)
    // =========================================

    platformCommission: {
      type: Number,
      required: true,
      min: 0
    },

    // =========================================
    // CREATOR NET EARNING (₦)
    // =========================================

    creatorEarning: {
      type: Number,
      required: true,
      min: 0
    },

    // =========================================
    // GIFT STATUS
    // =========================================

    status: {
      type: String,
      enum: [
        "completed",
        "failed"
      ],
      default: "completed"
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model("Gift", giftSchema);
