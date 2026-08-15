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
    // TOTAL GIFT VOLUME (₦)
    // =========================================
    // Jimillar darajar gifts da aka tura.
    // Misali:
    // 100 coins = ₦100 gift volume

    totalGiftVolume: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // TOTAL PLATFORM COMMISSION (₦)
    // =========================================
    // Platform tana karɓar 30%.

    totalCommission: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // TOTAL CREATOR EARNINGS (₦)
    // =========================================
    // Creator yana samun 70%.

    totalCreatorEarnings: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // TOTAL CREATOR WITHDRAWN (₦)
    // =========================================
    // Jimillar kuɗin da aka riga aka biya
    // creators ta automatic withdrawal.

    totalCreatorWithdrawn: {
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
