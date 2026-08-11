const Wallet = require("../models/Wallet");

exports.getWallet = async (req, res) => {
  try {

    const wallet = await Wallet.findOne({
      user: req.user._id
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    res.json({
      success: true,
      wallet: {
        coins: wallet.coins || 0,
        balance: wallet.balance || 0
      }
    });

  } catch (err) {

    console.error("GET WALLET ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};
