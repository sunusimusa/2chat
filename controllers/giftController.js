const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Gift = require("../models/Gift");

exports.sendGift = async (req, res) => {
  const session = await mongoose.startSession();

  try {

    const {
      receiverId,
      giftType,
      coins
    } = req.body;

    if (!receiverId || !giftType || !coins) {
      return res.status(400).json({
        success: false,
        message: "receiverId, giftType and coins are required"
      });
    }

    const amount = Number(coins);

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid coin amount"
      });
    }

    if (
      String(req.user._id) === String(receiverId)
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a gift to yourself"
      });
    }

    session.startTransaction();

    // =========================
    // SENDER WALLET
    // =========================

    const senderWallet =
      await Wallet.findOne({
        userId: req.user._id
      }).session(session);

    if (!senderWallet) {
      throw new Error("Sender wallet not found");
    }

    if (senderWallet.coins < amount) {

      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Insufficient coins"
      });

    }

    // =========================
    // CREATOR WALLET
    // =========================

    let receiverWallet =
      await Wallet.findOne({
        userId: receiverId
      }).session(session);

    if (!receiverWallet) {

      receiverWallet = new Wallet({
        userId: receiverId,
        coins: 0,
        totalEarned: 0,
        giftsReceived: 0
      });

      await receiverWallet.save({
        session
      });
    }

    // =========================
    // REMOVE SENDER COINS
    // =========================

    senderWallet.coins -= amount;
    senderWallet.totalSpent += amount;
    senderWallet.giftsSent += 1;

    // =========================
    // CREATOR EARNINGS
    // =========================

    receiverWallet.totalEarned += amount;
    receiverWallet.giftsReceived += 1;

    await senderWallet.save({
      session
    });

    await receiverWallet.save({
      session
    });

    // =========================
    // CREATE GIFT RECORD
    // =========================

    const creatorEarning = amount;

const gift = await Gift.create(
  [{
    senderId: req.user._id,
    receiverId,
    giftType,
    coins: amount,
    creatorEarning
  }],
  {
    session
  }
);

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Gift sent successfully",

      gift: gift[0],

      senderCoins:
        senderWallet.coins,

      creatorEarnings:
        receiverWallet.totalEarned
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
