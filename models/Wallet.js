const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {

    // =========================================
    // WALLET OWNER
    // =========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },


    // =========================================
    // SPENDER COINS
    // =========================================
    // Coins da user yake da su domin gifts
    // da sauran abubuwan da za mu ƙara nan gaba.

    coins: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // TOTAL COINS PURCHASED
    // =========================================

    totalPurchased: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // TOTAL COINS SPENT
    // =========================================

    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // CREATOR GROSS EARNINGS
    // =========================================
    // Jimillar value na gifts da creator
    // ya karɓa kafin platform commission.

    totalEarned: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // PLATFORM COMMISSION
    // =========================================
    // Adadin commission da platform ta cire
    // daga creator earnings.

    platformCommission: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // AVAILABLE CREATOR BALANCE
    // =========================================
    // Kuɗin da creator zai iya withdraw.

    availableBalance: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // WITHDRAWAL LOCKED BALANCE
    // =========================================
    // Kuɗin da withdrawal request ya kulle
    // har sai an kammala ko an soke withdrawal.

    withdrawalLockedBalance: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // TOTAL WITHDRAWN
    // =========================================
    // Jimillar kuɗin da creator ya riga ya
    // karɓa ta withdrawals.

    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // GIFTS SENT
    // =========================================

    giftsSent: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // GIFTS RECEIVED
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
