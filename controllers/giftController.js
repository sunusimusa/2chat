const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Gift = require("../models/Gift");


// =========================================
// GIFT FINANCIAL SETTINGS
// =========================================

// 100 coins = ₦100
const COIN_TO_NAIRA = 1;

// Platform keeps 30%
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
    // CALCULATE EARNINGS
    // =====================================

    const grossEarning =
      amount * COIN_TO_NAIRA;


    const platformCommission =
      grossEarning *
      PLATFORM_COMMISSION_RATE;


    const creatorEarning =
      grossEarning -
      platformCommission;


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
    // CHECK COINS
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

          totalEarned:
            0,

          platformCommission:
            0,

          availableBalance:
            0,

          withdrawalLockedBalance:
            0,

          totalWithdrawn:
            0,

          giftsReceived:
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
    // CREATOR EARNINGS
    // =====================================

    // Gross earning is stored in coins
    receiverWallet.totalEarned +=
      amount;


    // Platform commission in ₦
    receiverWallet.platformCommission +=
      platformCommission;


    // Creator's actual withdrawable money
    receiverWallet.availableBalance +=
      creatorEarning;


    receiverWallet.giftsReceived +=
      1;


    // =====================================
    // SAVE WALLETS
    // =====================================

    await senderWallet.save({
      session
    });


    await receiverWallet.save({
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

            // Creator's net earning in ₦
            creatorEarning:
              creatorEarning

          }
        ],
        {
          session
        }
      );


    // =====================================
    // COMMIT
    // =====================================

    await session.commitTransaction();


    // =====================================
    // RESPONSE
    // =====================================

    res.json({

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

        grossEarning:
          grossEarning,

        platformCommission:
          platformCommission,

        creatorEarning:
          creatorEarning

      },

      creatorBalance:
        receiverWallet.availableBalance,

      creatorGrossCoins:
        receiverWallet.totalEarned

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


    res.status(500).json({

      success:
        false,

      message:
        err.message

    });


  } finally {

    session.endSession();

  }

};


// =========================================
// GET RECEIVED GIFTS
// =========================================

exports.getReceivedGifts = async (
  req,
  res
) => {

  try {

    const gifts =
      await Gift.find({

        receiverId:
          req.user._id,

        status:
          "completed"

      })
        .populate(
          "senderId",
          "username name"
        )
        .sort({
          createdAt: -1
        });


    res.json({

      success:
        true,

      gifts

    });


  } catch (err) {

    console.error(
      "GET RECEIVED GIFTS ERROR:",
      err
    );


    res.status(500).json({

      success:
        false,

      message:
        err.message

    });

  }

};
