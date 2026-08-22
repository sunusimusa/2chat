const mongoose = require("mongoose");

const coinPurchaseSchema = new mongoose.Schema(
  {

    // =========================================
    // BUYER
    // =========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },


    // =========================================
    // COIN PACKAGE
    // =========================================

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CoinPackage",
      required: true,
      index: true
    },


    // =========================================
    // SNAPSHOT
    // =========================================
    // Muna ajiye exact values na lokacin
    // da aka yi purchase.
    //
    // Wannan yana kare order idan daga baya
    // an canza price na package.

    coins: {
      type: Number,
      required: true,
      min: 1
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      default: "NGN",
      uppercase: true,
      trim: true
    },


    // =========================================
    // ORDER REFERENCE
    // =========================================

    reference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },


    // =========================================
    // PAYMENT STATUS
    // =========================================

    status: {
      type: String,

      enum: [
        "pending",
        "paid",
        "failed",
        "cancelled",
        "expired"
      ],

      default: "pending",

      index: true
    },


    // =========================================
    // PAYMENT PROVIDER
    // =========================================

    paymentProvider: {
      type: String,

      enum: [
        "paystack",
        "flutterwave",
        "manual",
        "test"
      ],

      default: "test"
    },


    // =========================================
    // PAYMENT DATA
    // =========================================

    paidAt: {
      type: Date,
      default: null
    },

    paymentTransactionId: {
      type: String,
      default: null,
      index: true
    }

  },

  {
    timestamps: true
  }
);


module.exports =
  mongoose.model(
    "CoinPurchase",
    coinPurchaseSchema
  );
