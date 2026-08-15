const mongoose = require("mongoose");

const platformWalletSchema = new mongoose.Schema(
  {
    // =========================================
    // PLATFORM WALLET
    // =========================================

    key: {
      type: String,
      default: "main",
      unique: true,
      index: true
    },

    // =========================================
    // TOTAL GROSS REVENUE
    // =========================================

    totalGrossRevenue: {
      type: Number,
      default: 0,
      min: 0
    },

    // =========================================
    // TOTAL PLATFORM COMMISSION
    // =========================================

    totalCommission: {
      type: Number,
      default: 0,
      min: 0
    },

    // =========================================
    // TOTAL CREATOR EARNINGS
    // =========================================

    totalCreatorEarnings: {
      type: Number,
      default: 0,
      min: 0
    },

    // =========================================
    // TOTAL GIFTS
    // =========================================

    totalGifts: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model(
    "PlatformWallet",
    platformWalletSchema
  );
