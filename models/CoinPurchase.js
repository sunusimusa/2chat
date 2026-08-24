const mongoose = require("mongoose");


// =====================================================
// 2CHAT
// COIN PURCHASE MODEL
// =====================================================
//
// FLOW:
//
// Coin Package
//      ↓
// CoinPurchase
//      ↓
// Flutterwave Payment Method
//      ↓
// Flutterwave Charge
//      ↓
// Webhook / Verification
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
    //
    // Package ɗin da aka saya.
    // Ana adana value ɗin a lokacin order.
    //

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

        "flutterwave"

      ],

      default:
        "flutterwave",

      index:
        true

    },


    // =================================================
    // FLUTTERWAVE PAYMENT REFERENCE
    // =================================================
    //
    // Wannan zai iya zama provider reference.
    //

    paymentReference: {

      type:
        String,

      default:
        null,

      index:
        true

    },


    // =================================================
    // FLUTTERWAVE CUSTOMER ID
    // =================================================

    flutterwaveCustomerId: {

      type:
        String,

      default:
        null,

      trim:
        true

    },


    // =================================================
    // FLUTTERWAVE PAYMENT METHOD ID
    // =================================================
    //
    // Za a adana shi idan payment-method flow
    // ya samar da shi.
    //

    flutterwavePaymentMethodId: {

      type:
        String,

      default:
        null,

      trim:
        true

    },


    // =================================================
    // FLUTTERWAVE CHARGE ID
    // =================================================

    flutterwaveChargeId: {

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
    // Flutterwave checkout / redirect URL.
    //

    paymentUrl: {

      type:
        String,

      default:
        null

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
    // FLUTTERWAVE PROVIDER STATUS
    // =================================================
    //
    // Misali:
    //
    // pending
    // succeeded
    // failed
    //

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


// Flutterwave charge lookup
coinPurchaseSchema.index({

  flutterwaveChargeId:
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
