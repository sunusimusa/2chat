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
async (req, res) => {

    try {

        // =========================================
        // PURCHASE ID
        // =========================================

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Purchase ID is required."

            });

        }


        // =========================================
        // PAYMENT METHOD ID
        // =========================================
        //
        // Flutterwave v4 charge yana buƙatar
        // payment_method_id.
        //
        // =========================================

        const {
            paymentMethodId
        } = req.body || {};


        if (!paymentMethodId) {

            return res.status(400).json({

                success: false,

                message:
                    "Flutterwave payment method ID is required."

            });

        }


        // =========================================
        // FIND PURCHASE
        // =========================================

        const purchase =
            await CoinPurchase.findById(id);


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
                req.user._id
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
        // GET USER
        // =========================================

        const User =
            require("../models/User");


        const user =
            await User.findById(
                req.user._id
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
        // EMAIL CHECK
        // =========================================

        if (!user.email) {

            return res.status(400).json({

                success: false,

                message:
                    "Your account does not have an email address. Please add an email before making a payment."

            });

        }


        // =========================================
        // SAVE PAYMENT METHOD ID
        // =========================================
        //
        // Ba mu saka order zuwa paid ba.
        //
        // Payment method kawai muke adanawa.
        //
        // =========================================

        purchase.flutterwavePaymentMethodId =
            String(
                paymentMethodId
            );


        await purchase.save();


        // =========================================
        // INITIALIZE FLUTTERWAVE PAYMENT
        // =========================================

        const payment =
            await initializePayment({

                purchase,

                user,

                paymentMethodId:
                    String(
                        paymentMethodId
                    )

            });


        // =========================================
        // SAVE FLUTTERWAVE DETAILS
        // =========================================

        purchase.paymentProvider =
            "flutterwave";


        purchase.paymentReference =
            payment.reference;


        purchase.paymentInitializedAt =
            new Date();


        // =========================================
        // SAVE CHARGE ID
        // =========================================

        if (
            payment.chargeId
        ) {

            purchase.flutterwaveChargeId =
                String(
                    payment.chargeId
                );

        }


        // =========================================
        // SAVE PAYMENT STATUS
        // =========================================
        //
        // IMPORTANT:
        //
        // Ba mu saka:
        //
        // status = paid
        //
        // saboda initialize ba verification ba ne.
        //
        // =========================================

        await purchase.save();


        // =========================================
        // RESPONSE
        // =========================================

        return res.json({

            success: true,

            message:
                "Flutterwave payment initialized successfully.",

            payment: {

                provider:
                    payment.provider,

                reference:
                    payment.reference,

                amount:
                    payment.amount,

                currency:
                    payment.currency,

                email:
                    payment.email,

                customerId:
                    payment.customerId,

                paymentMethodId:
                    payment.paymentMethodId,

                chargeId:
                    payment.chargeId,

                checkoutUrl:
                    payment.checkoutUrl,

                nextAction:
                    payment.nextAction,

                status:
                    payment.status

            }

        });


    } catch (err) {

        console.error(
            "INITIALIZE COIN PAYMENT ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message ||
                "Failed to initialize Flutterwave payment."

        });

    }

};

exports.createCoinPaymentMethod = async (
req,
res
) => {

try {

    const {
        id
    } = req.params;


    const {
        card
    } = req.body;


    // =========================================
    // FIND PURCHASE
    // =========================================

    const purchase =
        await CoinPurchase.findById(id);


    if (!purchase) {

        return res.status(404).json({

            success: false,

            message:
                "Coin purchase order not found."

        });

    }


    // =========================================
    // OWNERSHIP
    // =========================================

    if (
        String(purchase.userId) !==
        String(req.user._id)
    ) {

        return res.status(403).json({

            success: false,

            message:
                "You are not allowed to access this purchase."

        });

    }


    // =========================================
    // STATUS
    // =========================================

    if (
        purchase.status !==
        "pending"
    ) {

        return res.status(400).json({

            success: false,

            message:
                `Payment cannot continue because order status is "${purchase.status}".`

        });

    }


    // =========================================
    // CARD DATA
    // =========================================

    if (!card) {

        return res.status(400).json({

            success: false,

            message:
                "Card payment data is required."

        });

    }


    // =========================================
    // USER
    // =========================================

    const User =
        require("../models/User");


    const user =
        await User.findById(
            req.user._id
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


    if (!user.email) {

        return res.status(400).json({

            success: false,

            message:
                "User email is required."

        });

    }


    // =========================================
    // GET FLUTTERWAVE TOKEN
    // =========================================

    const accessToken =
        await getFlutterwaveAccessToken();


    // =========================================
    // CREATE CUSTOMER
    // =========================================

    const customer =
        await createFlutterwaveCustomer({

            accessToken,

            user

        });


    // =========================================
    // CREATE PAYMENT METHOD
    // =========================================

    const paymentMethod =
        await createFlutterwavePaymentMethod({

            accessToken,

            customerId:
                customer.id,

            card

        });


    // =========================================
    // SAVE FLUTTERWAVE DATA
    // =========================================

    purchase.flutterwaveCustomerId =
        customer.id;


    purchase.flutterwavePaymentMethodId =
        paymentMethod.id;


    await purchase.save();


    // =========================================
    // RESPONSE
    // =========================================

    return res.json({

        success: true,

        message:
            "Flutterwave payment method created successfully.",

        paymentMethod: {

            id:
                paymentMethod.id,

            type:
                paymentMethod.type,

            card:
                paymentMethod.card

        }

    });


} catch (err) {

    console.error(
        "CREATE COIN PAYMENT METHOD ERROR:",
        err
    );


    return res.status(500).json({

        success: false,

        message:
            err.message ||
            "Failed to create payment method."

    });

}

};



