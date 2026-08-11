const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    // =========================================
    // OWNER
    // =========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // =========================================
    // COINS
    // =========================================

    coins: {
      type: Number,
      default: 0,
      min: 0
    },

    // =========================================
    // COINS PURCHASED
    // =========================================

    totalPurchased: {
      type: Number,
      default: 0,
      min: 0
    },

    // =========================================
    // COINS SPENT ON GIFTS
    // =========================================

    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },

    // =========================================
    // COINS EARNED FROM GIFTS
    // =========================================

    totalEarned: {
      type: Number,
      default: 0,
      min: 0
    },

    // =========================================
    // TOTAL GIFTS SENT
    // =========================================

    giftsSent: {
      type: Number,
      default: 0,
      min: 0
    },

    // =========================================
    // TOTAL GIFTS RECEIVED
    // =========================================

    giftsReceived: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);


// =========================================
// EXPORT
// =========================================

module.exports =
  mongoose.model("Wallet", walletSchema);
