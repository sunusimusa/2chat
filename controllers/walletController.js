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
