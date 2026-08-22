const crypto = require("crypto");

const User =
  require("../models/User");

const CoinPackage =
  require("../models/CoinPackage");

const CoinPurchase =
  require("../models/CoinPurchase");

const initializePayment =
  require("../services/paymentInitializationService");


// =====================================================
// CREATE COIN PURCHASE ORDER
// =====================================================

exports.createCoinPurchase = async (
  req,
  res
) => {

  try {

    // =========================================
    // AUTHENTICATED USER
    // =========================================

    const userId =
      req.user?._id;


    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required."

      });

    }


    // =========================================
    // PACKAGE ID
    // =========================================

    const {
      packageId
    } = req.body;


    if (!packageId) {

      return res.status(400).json({

        success: false,

        message:
          "Package ID is required."

      });

    }


    // =========================================
    // FIND ACTIVE PACKAGE
    // =========================================

    const coinPackage =
      await CoinPackage.findOne({

        _id:
          packageId,

        active:
          true

      });


    if (!coinPackage) {

      return res.status(404).json({

        success: false,

        message:
          "Coin package not found or unavailable."

      });

    }


    // =========================================
    // SNAPSHOT PACKAGE VALUES
    // =========================================

    const coins =
      Number(
        coinPackage.coins
      );


    const amount =
      Number(
        coinPackage.price
      );


    const currency =
      coinPackage.currency ||
      "NGN";


    // =========================================
    // VALIDATE COINS
    // =========================================

    if (
      !Number.isFinite(coins) ||
      coins <= 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid coin package."

      });

    }


    // =========================================
    // VALIDATE PRICE
    // =========================================

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid package price."

      });

    }


    // =========================================
    // CREATE UNIQUE REFERENCE
    // =========================================

    const reference =
      "2CHAT-" +
      Date.now() +
      "-" +
      crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase();


    // =========================================
    // CREATE PURCHASE ORDER
    // =========================================

    const purchase =
      await CoinPurchase.create({

        userId,

        packageId:
          coinPackage._id,

        // Snapshot
        coins,

        amount,

        currency,

        reference,

        status:
          "pending",

        // =====================================
        // REAL PAYMENT PROVIDER
        // =====================================

        paymentProvider:
          "flutterwave"

      });


    // =========================================
    // RESPONSE
    // =========================================

    return res.status(201).json({

      success: true,

      message:
        "Coin purchase order created successfully.",

      purchase: {

        id:
          purchase._id,

        reference:
          purchase.reference,

        packageId:
          purchase.packageId,

        coins:
          purchase.coins,

        amount:
          purchase.amount,

        currency:
          purchase.currency,

        status:
          purchase.status,

        paymentProvider:
          purchase.paymentProvider,

        createdAt:
          purchase.createdAt

      }

    });


  } catch (err) {

    console.error(
      "CREATE COIN PURCHASE ERROR:",
      err
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to create coin purchase order."

    });

  }

};



// =====================================================
// INITIALIZE COIN PURCHASE PAYMENT
// =====================================================

exports.initializeCoinPurchasePayment =
async (
  req,
  res
) => {

  try {

    // =========================================
    // PURCHASE ID
    // =========================================

    const {
      id
    } = req.params;


    // =========================================
    // AUTHENTICATED USER
    // =========================================

    const userId =
      req.user?._id;


    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required."

      });

    }


    // =========================================
    // FIND PURCHASE
    // =========================================

    const purchase =
      await CoinPurchase.findById(
        id
      );


    if (!purchase) {

      return res.status(404).json({

        success: false,

        message:
          "Coin purchase order not found."

      });

    }


    // =========================================
    // OWNERSHIP CHECK
    // =========================================

    if (
      String(
        purchase.userId
      ) !==
      String(
        userId
      )
    ) {

      return res.status(403).json({

        success: false,

        message:
          "You are not allowed to access this purchase."

      });

    }


    // =========================================
    // STATUS CHECK
    // =========================================

    if (
      purchase.status !==
      "pending"
    ) {

      return res.status(400).json({

        success: false,

        message:
          `Payment cannot be initialized because order status is "${purchase.status}".`

      });

    }


    // =========================================
    // CHECK PROVIDER
    // =========================================

    if (
      purchase.paymentProvider !==
      "flutterwave"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "This purchase is not configured for Flutterwave."

      });

    }


    // =========================================
    // GET USER
    // =========================================

    const user =
      await User.findById(
        userId
      )
      .select(
        "username email"
      );


    if (!user) {

      return res.status(404).json({

        success: false,

        message:
          "User not found."

      });

    }


    // =========================================
    // USER EMAIL REQUIRED
    // =========================================

    if (
      !user.email
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Your account must have an email address before payment."

      });

    }


    // =========================================
    // INITIALIZE FLUTTERWAVE PAYMENT
    // =========================================

    const payment =
      await initializePayment({

        purchase,

        user

      });


    // =========================================
    // VALIDATE PAYMENT RESPONSE
    // =========================================

    if (
      !payment
    ) {

      return res.status(502).json({

        success: false,

        message:
          "Flutterwave payment initialization returned an empty response."

      });

    }


    // =========================================
    // SAVE PROVIDER
    // =========================================

    purchase.paymentProvider =
      "flutterwave";


    // =========================================
    // PAYMENT REFERENCE
    // =========================================

    if (
      payment.reference
    ) {

      purchase.paymentReference =
        payment.reference;

    }


    // =========================================
    // FLUTTERWAVE CUSTOMER ID
    // =========================================

    if (
      payment.customerId
    ) {

      purchase.flutterwaveCustomerId =
        payment.customerId;

    }


    // =========================================
    // PAYMENT METHOD ID
    // =========================================

    if (
      payment.paymentMethodId
    ) {

      purchase.flutterwavePaymentMethodId =
        payment.paymentMethodId;

    }


    // =========================================
    // CHARGE ID
    // =========================================

    if (
      payment.chargeId
    ) {

      purchase.flutterwaveChargeId =
        payment.chargeId;

    }


    // =========================================
    // PAYMENT URL
    // =========================================

    if (
      payment.paymentUrl
    ) {

      purchase.paymentUrl =
        payment.paymentUrl;

    }


    // =========================================
    // INITIALIZED TIME
    // =========================================

    purchase.paymentInitializedAt =
      new Date();


    // =========================================
    // IMPORTANT
    // =========================================
    // Kada mu saka "paid" a nan.
    //
    // Webhook + verification ne su
    // za yin hakan daga baya.
    // =========================================

    purchase.status =
      "pending";


    await purchase.save();


    // =========================================
    // RESPONSE
    // =========================================

    return res.status(200).json({

      success: true,

      message:
        "Flutterwave payment initialized successfully.",

      payment: {

        provider:
          "flutterwave",

        reference:
          payment.reference ||
          purchase.reference,

        paymentUrl:
          payment.paymentUrl ||
          null,

        customerId:
          payment.customerId ||
          null,

        paymentMethodId:
          payment.paymentMethodId ||
          null,

        chargeId:
          payment.chargeId ||
          null,

        status:
          payment.status ||
          "pending"

      },

      purchase: {

        id:
          purchase._id,

        coins:
          purchase.coins,

        amount:
          purchase.amount,

        currency:
          purchase.currency,

        status:
          purchase.status,

        reference:
          purchase.reference

      }

    });


  } catch (err) {

    console.error(
      "INITIALIZE COIN PAYMENT ERROR:",
      err
    );


    return res.status(
      err.status || 500
    ).json({

      success: false,

      message:
        err.message ||
        "Failed to initialize Flutterwave payment."

    });

  }

};
