const Wallet = require("../models/Wallet");

exports.getWallet = async (req, res) => {
  try {

    let wallet = await Wallet.findOne({
      userId: req.user._id
    });

    // =====================================
    // CREATE WALLET FOR OLD/NEW USER
    // =====================================

    if (!wallet) {

      wallet = await Wallet.create({
        userId: req.user._id,
        coins: 0,
        balance: 0
      });

    }

    // =====================================
    // RETURN WALLET
    // =====================================

    res.json({
      success: true,
      wallet: {
        coins: wallet.coins || 0,
        balance: wallet.balance || 0
      }
    });

  } catch (err) {

    console.error(
      "GET WALLET ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.getEarnings = async (req, res) => {
  try {

    const wallet = await Wallet.findOne({
      userId: req.user._id
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    res.json({
      success: true,
      earnings: {
        totalEarned: wallet.totalEarned || 0,
        giftsReceived: wallet.giftsReceived || 0
      }
    });

  } catch (err) {

    console.error(
      "GET EARNINGS ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.testAddCoins = async (req, res) => {
  try {

    let wallet = await Wallet.findOne({
      userId: req.user._id
    });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        coins: 0
      });
    }

    wallet.coins += 100;
    wallet.totalPurchased += 100;

    await wallet.save();

    res.json({
      success: true,
      message: "100 test coins added",
      coins: wallet.coins
    });

  } catch (err) {

    console.error("TEST ADD COINS ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};
