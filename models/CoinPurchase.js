const mongoose = require("mongoose");


// =====================================================
// COIN PURCHASE SCHEMA
// =====================================================

const coinPurchaseSchema = new mongoose.Schema(
  {

    // =========================================
    // USER
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
    // COINS SNAPSHOT
    // =========================================
    //
    // Muh adana coins ɗin lokacin da aka
    // ƙirƙiri order.
    //
    // Ko package ya canza daga baya,
    // wannan order ba zai canza ba.
    //

    coins: {
      type: Number,
      required: true,
      min: 1
    },


    // =========================================
    // AMOUNT SNAPSHOT
    // =========================================

    amount: {
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
      uppercase: true,
      trim: true
    },


    // =========================================
    // 2CHAT ORDER REFERENCE
    // =========================================

    reference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },


    // =========================================
    // PAYMENT PROVIDER
    // =========================================

    paymentProvider: {
      type: String,
      enum: [
        "flutterwave"
      ],
      default: "flutterwave",
      index: true
    },


    // =========================================
    // PROVIDER PAYMENT REFERENCE
    // =========================================
    //
    // Flutterwave/payment reference.
    //

    paymentReference: {
      type: String,
      default: null,
      index: true
    },


    // =========================================
    // FLUTTERWAVE CUSTOMER ID
    // =========================================

    flutterwaveCustomerId: {
      type: String,
      default: null
    },


    // =========================================
    // FLUTTERWAVE PAYMENT METHOD ID
    // =========================================

    flutterwavePaymentMethodId: {
      type: String,
      default: null
    },


    // =========================================
    // FLUTTERWAVE CHARGE ID
    // =========================================

    flutterwaveChargeId: {
      type: String,
      default: null,
      index: true
    },


    // =========================================
    // PAYMENT URL
    // =========================================
    //
    // URL da user zai bi domin kammala payment.
    //

    paymentUrl: {
      type: String,
      default: null
    },


    // =========================================
    // PAYMENT INITIALIZED AT
    // =========================================

    paymentInitializedAt: {
      type: Date,
      default: null
    },


    // =========================================
    // PAYMENT COMPLETED AT
    // =========================================

    paymentCompletedAt: {
      type: Date,
      default: null
    },


    // =========================================
    // PAYMENT VERIFIED AT
    // =========================================

    paymentVerifiedAt: {
      type: Date,
      default: null
    },


    // =========================================
    // PAYMENT STATUS
    // =========================================

    status: {
      type: String,

      enum: [
        "pending",
        "processing",
        "paid",
        "failed",
        "cancelled",
        "expired"
      ],

      default: "pending",

      index: true
    },


    // =========================================
    // PROVIDER STATUS
    // =========================================
    //
    // Misali:
    // succeeded
    // pending
    // failed
    //

    providerStatus: {
      type: String,
      default: null
    },


    // =========================================
    // FAILURE REASON
    // =========================================

    failureReason: {
      type: String,
      default: null
    },


    // =========================================
    // WEBHOOK RECEIVED
    // =========================================

    webhookReceived: {
      type: Boolean,
      default: false
    },


    // =========================================
    // WEBHOOK RECEIVED AT
    // =========================================

    webhookReceivedAt: {
      type: Date,
      default: null
    },


    // =========================================
    // VERIFICATION
    // =========================================

    verificationAttempts: {
      type: Number,
      default: 0,
      min: 0
    },


    // =========================================
    // COINS CREDITED
    // =========================================
    //
    // Wannan yana hana mu ƙara coins sau biyu
    // idan webhook ya sake zuwa.
    //

    coinsCredited: {
      type: Boolean,
      default: false,
      index: true
    },


    // =========================================
    // COINS CREDITED AT
    // =========================================

    coinsCreditedAt: {
      type: Date,
      default: null
    }

  },

  {
    timestamps: true
  }
);


// =====================================================
// INDEXES
// =====================================================

coinPurchaseSchema.index({
  userId: 1,
  createdAt: -1
});


coinPurchaseSchema.index({
  status: 1,
  createdAt: -1
});


// =====================================================
// EXPORT
// =====================================================

module.exports =
  mongoose.model(
    "CoinPurchase",
    coinPurchaseSchema
  );
