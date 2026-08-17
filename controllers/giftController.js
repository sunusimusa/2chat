const mongoose = require("mongoose");

const Wallet =
  require("../models/Wallet");

const Gift =
  require("../models/Gift");

const PlatformWallet =
  require("../models/PlatformWallet");


// =========================================
// GIFT FINANCIAL SETTINGS
// =========================================

// 100 coins = ₦100
const COIN_TO_NAIRA = 1;

// Platform commission = 30%
const PLATFORM_COMMISSION_RATE = 0.30;


// =========================================
// SEND GIFT
// =========================================

exports.sendGift = async (req, res) => {

  const session =
    await mongoose.startSession();

  try {

    const {
      receiverId,
      giftType,
      coins
    } = req.body;


    // =====================================
    // VALIDATION
    // =====================================

    if (
      !receiverId ||
      !giftType ||
      !coins
    ) {

      return res.status(400).json({
        success: false,
        message:
          "receiverId, giftType and coins are required"
      });

    }


    const amount =
      Number(coins);


    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Invalid coin amount"
      });

    }


    // =====================================
    // PREVENT SELF GIFT
    // =====================================

    if (
      String(req.user._id) ===
      String(receiverId)
    ) {

      return res.status(400).json({
        success: false,
        message:
          "You cannot send a gift to yourself"
      });

    }


    // =====================================
    // FINANCIAL CALCULATION
    // =====================================

    const grossAmount =
      amount * COIN_TO_NAIRA;


    const platformCommission =
      Number(
        (
          grossAmount *
          PLATFORM_COMMISSION_RATE
        ).toFixed(2)
      );


    const creatorEarning =
      Number(
        (
          grossAmount -
          platformCommission
        ).toFixed(2)
      );


    // =====================================
    // START TRANSACTION
    // =====================================

    session.startTransaction();


    // =====================================
    // SENDER WALLET
    // =====================================

    const senderWallet =
      await Wallet.findOne({
        userId: req.user._id
      }).session(session);


    if (!senderWallet) {

      throw new Error(
        "Sender wallet not found"
      );

    }


    // =====================================
    // CHECK SENDER COINS
    // =====================================

    if (
      senderWallet.coins <
      amount
    ) {

      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Insufficient coins"
      });

    }


    // =====================================
    // CREATOR WALLET
    // =====================================

    let receiverWallet =
      await Wallet.findOne({
        userId: receiverId
      }).session(session);


    if (!receiverWallet) {

      receiverWallet =
        new Wallet({

          userId:
            receiverId,

          coins:
            0,

          totalPurchased:
            0,

          totalSpent:
            0,

          totalEarned:
            0,

          platformCommission:
            0,

          availableBalance:
            0,

          totalWithdrawn:
            0,

          giftsSent:
            0,

          giftsReceived:
            0

        });

    }


    // =====================================
    // PLATFORM WALLET
    // =====================================

    let platformWallet =
      await PlatformWallet.findOne({
        key: "main"
      }).session(session);


    if (!platformWallet) {

      platformWallet =
        new PlatformWallet({

          key:
            "main",

          totalGiftVolume: 0,
          
          totalCommission:
            0,

          totalCreatorEarnings:
            0,

          totalGifts:
            0

        });

    }


    // =====================================
    // REMOVE SENDER COINS
    // =====================================

    senderWallet.coins -=
      amount;

    senderWallet.totalSpent +=
      amount;

    senderWallet.giftsSent +=
      1;


    // =====================================
    // CREATOR ACCOUNTING
    // =====================================

    receiverWallet.totalEarned +=
    grossAmount;
    
    receiverWallet.availableBalance +=
      creatorEarning;

    receiverWallet.giftsReceived +=
      1;


    // =====================================
    // PLATFORM ACCOUNTING
    // =====================================

    platformWallet.totalGiftVolume +=
  grossAmount;
    
    platformWallet.totalCommission +=
      platformCommission;

    platformWallet.totalCreatorEarnings +=
      creatorEarning;

    platformWallet.totalGifts +=
      1;


    // =====================================
    // SAVE SENDER
    // =====================================

    await senderWallet.save({
      session
    });


    // =====================================
    // SAVE CREATOR
    // =====================================

    await receiverWallet.save({
      session
    });


    // =====================================
    // SAVE PLATFORM
    // =====================================

    await platformWallet.save({
      session
    });


    // =====================================
    // CREATE GIFT RECORD
    // =====================================

    const gift =
      await Gift.create(
        [
          {

            senderId:
              req.user._id,

            receiverId:
              receiverId,

            giftType:
              giftType,

            coins:
              amount,

            grossAmount:
              grossAmount,

            platformCommission:
              platformCommission,

            creatorEarning:
              creatorEarning

          }
        ],
        {
          session
        }
      );


    // =====================================
    // COMMIT TRANSACTION
    // =====================================

    await session.commitTransaction();


    // =====================================
    // RESPONSE
    // =====================================

    return res.json({

      success:
        true,

      message:
        "Gift sent successfully",

      gift:
        gift[0],

      senderCoins:
        senderWallet.coins,

      financial: {

        coins:
          amount,

        grossAmount:
          grossAmount,

        platformCommission:
          platformCommission,

        creatorEarning:
          creatorEarning

      },

      creatorBalance:
        receiverWallet.availableBalance,

      platformCommissionTotal:
        platformWallet.totalCommission

    });


  } catch (err) {


    // =====================================
    // ROLLBACK
    // =====================================

    await session.abortTransaction();


    console.error(
      "SEND GIFT ERROR:",
      err
    );


    return res.status(500).json({

      success:
        false,

      message:
        err.message

    });


  } finally {

    session.endSession();

  }

};

exports.getReceivedGifts = async (req, res) => {
  try {

    // =========================================
    // GET RECEIVED GIFTS HISTORY
    // =========================================

    const gifts = await Gift.find({
      receiverId: req.user._id,
      status: "completed"
    })
      .populate(
        "senderId",
        "username name"
      )
      .sort({
        createdAt: -1
      });


    // =========================================
    // GET WALLET
    // =========================================

    const wallet = await Wallet.findOne({
      userId: req.user._id
    });


    // =========================================
    // WALLET TOTALS
    // =========================================

    const totalEarned =
      Number(wallet?.totalEarned || 0);

    const giftsReceived =
      Number(wallet?.giftsReceived || 0);


    // =========================================
    // RESPONSE
    // =========================================

    return res.json({

      success: true,

      // Gift history
      gifts,

      // IMPORTANT:
      // These come directly from Wallet,
      // NOT by adding old gift records.

      totalEarned,

      giftsReceived

    });


  } catch (err) {

    console.error(
      "GET RECEIVED GIFTS ERROR:",
      err
    );


    return res.status(500).json({

      success: false,

      message: err.message

    });

  }
};
