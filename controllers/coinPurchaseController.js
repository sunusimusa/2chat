const crypto = require("crypto");

const CoinPackage =
  require("../models/CoinPackage");

const CoinPurchase =
  require("../models/CoinPurchase");


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
