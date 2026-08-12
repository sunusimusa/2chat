const mongoose = require("mongoose");

const Wallet = require("../models/Wallet");
const Gift = require("../models/Gift");
const User = require("../models/User");

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
        message: "receiverId, giftType and coins are required"
      });

    }

    if (coins <= 0) {

      return res.status(400).json({
        success: false,
        message: "Gift coins must be greater than 0"
      });

    }

    if (
      !mongoose.Types.ObjectId.isValid(
        receiverId
      )
    ) {

      return res.status(400).json({
        success: false,
        message: "Invalid receiver ID"
      });

    }

    // =====================================
    // FIND USERS
    // =====================================

    const sender =
      await User.findById(req.user._id);

    const receiver =
      await User.findById(receiverId);

    if (!sender) {

      return res.status(404).json({
        success: false,
        message: "Sender not found"
      });

    }

    if (!receiver) {

      return res.status(404).json({
        success: false,
        message: "Receiver not found"
      });

    }

    if (
      sender._id.toString() ===
      receiver._id.toString()
    ) {

      return res.status(400).json({
        success: false,
        message: "You cannot send a gift to yourself"
      });

    }

    // =====================================
    // START TRANSACTION
    // =====================================

    session.startTransaction();

    // =====================================
    // GET / CREATE SENDER WALLET
    // =====================================

    let senderWallet =
      await Wallet.findOne({
        userId: sender._id
      }).session(session);

    if (!senderWallet) {

      senderWallet =
        await Wallet.create(
          [{
            userId: sender._id,
            coins: 0
          }],
          { session }
        );

      senderWallet =
        senderWallet[0];

    }

    // =====================================
    // GET / CREATE RECEIVER WALLET
    // =====================================

    let receiverWallet =
      await Wallet.findOne({
        userId: receiver._id
      }).session(session);

    if (!receiverWallet) {

      receiverWallet =
        await Wallet.create(
          [{
            userId: receiver._id,
            coins: 0
          }],
          { session }
        );

      receiverWallet =
        receiverWallet[0];

    }

    // =====================================
    // CHECK COINS
    // =====================================

    if (
      senderWallet.coins < coins
    ) {

      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Not enough coins"
      });

    }

    // =====================================
    // CREATOR EARNING
    // =====================================

    const creatorEarning =
      coins;

    // =====================================
    // UPDATE SENDER
    // =====================================

    senderWallet.coins -= coins;

    senderWallet.totalSpent += coins;

    senderWallet.giftsSent += 1;

    await senderWallet.save({
      session
    });

    // =====================================
    // UPDATE RECEIVER
    // =====================================

    receiverWallet.totalEarned +=
      creatorEarning;

    receiverWallet.giftsReceived += 1;

    await receiverWallet.save({
      session
    });

    // =====================================
    // CREATE GIFT RECORD
    // =====================================

    const gift =
      await Gift.create(
        [{
          senderId: sender._id,

          receiverId: receiver._id,

          giftType,

          coins,

          creatorEarning,

          status: "completed"
        }],
        {
          session
        }
      );

    // =====================================
    // COMMIT
    // =====================================

    await session.commitTransaction();

    res.json({

      success: true,

      message: "Gift sent successfully",

      gift: gift[0],

      senderWallet: {
        coins: senderWallet.coins,
        totalSpent: senderWallet.totalSpent,
        giftsSent: senderWallet.giftsSent
      },

      receiverWallet: {
        totalEarned:
          receiverWallet.totalEarned,

        giftsReceived:
          receiverWallet.giftsReceived
      }

    });

  } catch (err) {

    await session.abortTransaction();

    console.error(
      "SEND GIFT ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message
    });

  } finally {

    session.endSession();

  }

};
