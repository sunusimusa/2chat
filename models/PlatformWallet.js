const mongoose = require("mongoose");

const platformWalletSchema = new mongoose.Schema(
  {

    // =========================================
    // PLATFORM WALLET KEY
    // =========================================

    key: {
      type: String,
      default: "main",
      unique: true,
      index: true,
      trim: true
    },


    // =========================================
    // TOTAL GIFT VOLUME
    // =========================================
    // Jimillar value na duk gifts da aka tura.
    //
    // 1 coin = ₦1
    //
    // Misali:
    // 100 coins = ₦100

    totalGiftVolume: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // TOTAL PLATFORM COMMISSION
    // =========================================
    // Jimillar 30% commission da platform ta samu.

    totalCommission: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // TOTAL CREATOR EARNINGS
    // =========================================
    // Jimillar 70% da creators suka samu.

    totalCreatorEarnings: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // TOTAL CREATOR WITHDRAWN
    // =========================================
    // Jimillar kuɗin da aka riga aka biya
    // creators ta withdrawal.

    totalCreatorWithdrawn: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // TOTAL GIFTS
    // =========================================
    // Yawan gifts da aka kammala.

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


// =========================================
// EXPORT
// =========================================

module.exports =
  mongoose.model(
    "PlatformWallet",
    platformWalletSchema
  );
