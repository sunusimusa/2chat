const crypto = require("crypto");

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
    // FIND PACKAGE
    // =========================================

    const coinPackage =
      await CoinPackage.findOne({

        _id: packageId,

        active: true

      });


    if (!coinPackage) {

      return res.status(404).json({

        success: false,

        message:
          "Coin package not found or unavailable."

      });

    }


    // =========================================
    // VALIDATE PACKAGE VALUES
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


    if (
      !Number.isFinite(amount) ||
      amount < 0
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
    // CREATE PURCHASE
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

        // Temporary provider
        // Za canza zuwa Paystack/Flutterwave
        // lokacin da payment gateway ya shiga.
        paymentProvider:
          "test"

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

        const {
            id
        } = req.params;


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
        //
        // User ba zai iya initialize payment
        // na wani user's order ba.
        //

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
        // INITIALIZE PAYMENT
        // =========================================

        const payment =
            await initializePayment({

                purchase,

                user

            });


        // =========================================
        // SAVE PAYMENT INITIALIZATION
        // =========================================
        //
        // Ba mu canza status zuwa paid ba.
        //
        // Payment kawai aka initialize.
        //

        purchase.paymentProvider =
            payment.provider;


        purchase.paymentReference =
            payment.reference;


        purchase.paymentInitializedAt =
            new Date();


        await purchase.save();


        // =========================================
        // RESPONSE
        // =========================================

        return res.json({

            success: true,

            message:
                "Payment initialized successfully.",

            payment

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
                "Failed to initialize payment."

        });

    }

};
