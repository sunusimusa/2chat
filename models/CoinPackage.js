const mongoose = require("mongoose");

const coinPackageSchema = new mongoose.Schema(
  {
    // =========================================
    // PACKAGE NAME
    // =========================================

    name: {
      type: String,
      required: true,
      trim: true
    },

    // =========================================
    // COINS
    // =========================================

    coins: {
      type: Number,
      required: true,
      min: 1
    },

    // =========================================
    // PRICE
    // =========================================
    // 1 Coin = ₦1 a tsarinmu na yanzu

    price: {
      type: Number,
      required: true,
      min: 0
    },

    // =========================================
    // CURRENCY
    // =========================================

    currency: {
      type: String,
      default: "NGN",
      uppercase: true
    },

    // =========================================
    // ACTIVE
    // =========================================
    // Idan false ne, package ba zai bayyana
    // a Buy Coins page ba.

    active: {
      type: Boolean,
      default: true
    },

    // =========================================
    // ORDER
    // =========================================

    sortOrder: {
      type: Number,
      default: 0
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
  mongoose.model("CoinPackage", coinPackageSchema);
