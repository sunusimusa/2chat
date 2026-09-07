const mongoose = require("mongoose");


// =====================================================
// 2CHAT
// COIN PURCHASE MODEL — PAYSTACK
// =====================================================
//
// FLOW:
//
// Coin Package
//      ↓
// CoinPurchase
//      ↓
// Paystack Initialize
//      ↓
// Paystack Checkout
//      ↓
// Paystack Webhook / Verification
//      ↓
// Payment Verified
//      ↓
// Credit Coins
//
// IMPORTANT:
//
// - Purchase baya zama "paid" yayin initialization.
// - Verification ne kawai zai tabbatar da payment.
// - coinsCredited yana hana double credit.
// - Legacy user wallet babu shi => credit service zai ƙirƙira.
// =====================================================


const coinPurchaseSchema = new mongoose.Schema(
  {

    // =================================================
    // USER
    // =================================================

    userId: {

      type:
        mongoose.Schema.Types.ObjectId,

      ref:
        "User",

      required:
        true,

      index:
        true

    },


    // =================================================
    // COIN PACKAGE
    // =================================================

    packageId: {

      type:
        mongoose.Schema.Types.ObjectId,

      ref:
        "CoinPackage",

      required:
        true,

      index:
        true

    },


    // =================================================
    // COINS SNAPSHOT
    // =================================================

    coins: {

      type:
        Number,

      required:
        true,

      min:
        1

    },


    // =================================================
    // AMOUNT SNAPSHOT
    // =================================================

    amount: {

      type:
        Number,

      required:
        true,

      min:
        0

    },


    // =================================================
    // CURRENCY
    // =================================================

    currency: {

      type:
        String,

      default:
        "NGN",

      uppercase:
        true,

      trim:
        true

    },


    // =================================================
    // 2CHAT PURCHASE REFERENCE
    // =================================================
    //
    // Wannan shine unique reference na 2CHAT.
    //
    // Misali:
    // 2CHAT-1750000000000-A1B2C3D4
    //
    // Za mu kuma amfani da shi a Paystack.
    // =================================================

    reference: {

      type:
        String,

      required:
        true,

      unique:
        true,

      index:
        true,

      trim:
        true

    },


    // =================================================
    // PAYMENT PROVIDER
    // =================================================

    paymentProvider: {

      type:
        String,

      enum: [

        "paystack"

      ],

      default:
        "paystack",

      index:
        true

    },


    // =================================================
    // PAYSTACK PAYMENT REFERENCE
    // =================================================
    //
    // Paystack transaction reference.
    //
    // =================================================

    paymentReference: {

      type:
        String,

      default:
        null,

      index:
        true,

      trim:
        true

    },


    // =================================================
    // PAYSTACK ACCESS CODE
    // =================================================
    //
    // Paystack yana iya dawo da access_code
    // bayan initialize transaction.
    //
    // =================================================

    paystackAccessCode: {

      type:
        String,

      default:
        null,

      trim:
        true

    },


    // =================================================
    // PAYSTACK TRANSACTION ID
    // =================================================
    //
    // ID ɗin transaction daga Paystack.
    //
    // =================================================

    paystackTransactionId: {

      type:
        String,

      default:
        null,

      index:
        true,

      trim:
        true

    },


    // =================================================
    // PAYMENT URL
    // =================================================
    //
    // Paystack authorization URL.
    //
    // User zai shiga wannan URL domin biyan kuɗi.
    //
    // =================================================

    paymentUrl: {

      type:
        String,

      default:
        null,

      trim:
        true

    },


    // =================================================
    // PAYMENT INITIALIZED AT
    // =================================================

    paymentInitializedAt: {

      type:
        Date,

      default:
        null

    },


    // =================================================
    // PAYMENT COMPLETED AT
    // =================================================

    paymentCompletedAt: {

      type:
        Date,

      default:
        null

    },


    // =================================================
    // PAYMENT VERIFIED AT
    // =================================================

    paymentVerifiedAt: {

      type:
        Date,

      default:
        null

    },


    // =================================================
    // PURCHASE STATUS
    // =================================================
    //
    // pending
    // processing
    // paid
    // failed
    // cancelled
    // expired
    //
    // =================================================

    status: {

      type:
        String,

      enum: [

        "pending",

        "processing",

        "paid",

        "failed",

        "cancelled",

        "expired"

      ],

      default:
        "pending",

      index:
        true

    },


    // =================================================
    // PAYSTACK PROVIDER STATUS
    // =================================================
    //
    // Misali:
    //
    // initialized
    // pending
    // success
    // failed
    //
    // =================================================

    providerStatus: {

      type:
        String,

      default:
        null,

      trim:
        true

    },


    // =================================================
    // FAILURE REASON
    // =================================================

    failureReason: {

      type:
        String,

      default:
        null

    },


    // =================================================
    // WEBHOOK RECEIVED
    // =================================================

    webhookReceived: {

      type:
        Boolean,

      default:
        false

    },


    // =================================================
    // WEBHOOK RECEIVED AT
    // =================================================

    webhookReceivedAt: {

      type:
        Date,

      default:
        null

    },


    // =================================================
    // VERIFICATION ATTEMPTS
    // =================================================

    verificationAttempts: {

      type:
        Number,

      default:
        0,

      min:
        0

    },


    // =================================================
    // COINS CREDITED
    // =================================================
    //
    // VERY IMPORTANT:
    //
    // true = an riga coins an riga.
    //
    // Wannan yana hana:
    //
    // webhook sau biyu
    // verification sau biyu
    // user refresh
    // duplicate request
    //
    // daga ƙara coins sau biyu.
    //
    // =================================================

    coinsCredited: {

      type:
        Boolean,

      default:
        false,

      index:
        true

    },


    // =================================================
    // COINS CREDITED AT
    // =================================================

    coinsCreditedAt: {

      type:
        Date,

      default:
        null

    }

  },


  {
    timestamps:
      true
  }

);


// =====================================================
// INDEXES
// =====================================================


// User purchases

coinPurchaseSchema.index({

  userId:
    1,

  createdAt:
    -1

});


// Purchase status

coinPurchaseSchema.index({

  status:
    1,

  createdAt:
    -1

});


// Paystack transaction lookup

coinPurchaseSchema.index({

  paystackTransactionId:
    1

});


// Payment reference lookup

coinPurchaseSchema.index({

  paymentReference:
    1

});


// =====================================================
// EXPORT
// =====================================================

module.exports =
  mongoose.model(
    "CoinPurchase",
    coinPurchaseSchema
  );
