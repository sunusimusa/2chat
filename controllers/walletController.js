const Wallet = require("../models/Wallet");


// =========================================
// GET WALLET
// =========================================

exports.getWallet = async (req, res) => {
  try {

    let wallet = await Wallet.findOne({
      userId: req.user._id
    });


    // =====================================
    // CREATE WALLET IF MISSING
    // =====================================

    if (!wallet) {

      wallet = await Wallet.create({
        userId: req.user._id,
        coins: 0,
        totalPurchased: 0,
        totalSpent: 0,
        totalEarned: 0,
        platformCommission: 0,
        availableBalance: 0,
        totalWithdrawn: 0,
        giftsSent: 0,
        giftsReceived: 0
      });

    }


    // =====================================
    // RETURN WALLET
    // =====================================

    res.json({

      success: true,

      wallet: {

        // -------------------------------
        // SPENDER COINS
        // -------------------------------

        coins:
          wallet.coins || 0,


        // -------------------------------
        // CREATOR EARNINGS
        // -------------------------------

        totalEarned:
          wallet.totalEarned || 0,

        platformCommission:
          wallet.platformCommission || 0,

        availableBalance:
          wallet.availableBalance || 0,

        totalWithdrawn:
          wallet.totalWithdrawn || 0,


        // -------------------------------
        // GIFT STATISTICS
        // -------------------------------

        giftsSent:
          wallet.giftsSent || 0,

        giftsReceived:
          wallet.giftsReceived || 0,


        // -------------------------------
        // BACKWARD COMPATIBILITY
        // -------------------------------
        // Old wallet.html still expects
        // "balance".
        //
        // We now use availableBalance
        // as the creator's money balance.

        balance:
          wallet.availableBalance || 0

      }

    });


  } catch (err) {

    console.error(
      "GET WALLET ERROR:",
      err
    );

    res.status(500).json({

      success: false,

      message:
        err.message

    });

  }
};



// =========================================
// GET CREATOR EARNINGS
// =========================================

exports.getEarnings = async (req, res) => {
  try {

    let wallet = await Wallet.findOne({
      userId: req.user._id
    });


    // =====================================
    // CREATE WALLET IF MISSING
    // =====================================

    if (!wallet) {

      wallet = await Wallet.create({
        userId: req.user._id,
        coins: 0,
        totalPurchased: 0,
        totalSpent: 0,
        totalEarned: 0,
        platformCommission: 0,
        availableBalance: 0,
        totalWithdrawn: 0,
        giftsSent: 0,
        giftsReceived: 0
      });

    }


    // =====================================
    // RETURN CREATOR EARNINGS
    // =====================================

    res.json({

      success: true,

      earnings: {

        // Gross gift earnings
        totalEarned:
          wallet.totalEarned || 0,

        // Platform's 30% commission
        platformCommission:
          wallet.platformCommission || 0,

        // Creator's current withdrawable money
        availableBalance:
          wallet.availableBalance || 0,

        // Money already withdrawn
        totalWithdrawn:
          wallet.totalWithdrawn || 0,

        // Number of gifts received
        giftsReceived:
          wallet.giftsReceived || 0

      }

    });


  } catch (err) {

    console.error(
      "GET EARNINGS ERROR:",
      err
    );

    res.status(500).json({

      success: false,

      message:
        err.message

    });

  }
};



// =========================================
// TEST ADD COINS
// =========================================

exports.testAddCoins = async (req, res) => {
  try {

    let wallet = await Wallet.findOne({
      userId: req.user._id
    });


    // =====================================
    // CREATE WALLET IF MISSING
    // =====================================

    if (!wallet) {

      wallet = await Wallet.create({
        userId: req.user._id,
        coins: 0,
        totalPurchased: 0,
        totalSpent: 0,
        totalEarned: 0,
        platformCommission: 0,
        availableBalance: 0,
        totalWithdrawn: 0,
        giftsSent: 0,
        giftsReceived: 0
      });

    }


    // =====================================
    // ADD TEST COINS
    // =====================================

    wallet.coins += 100;

    wallet.totalPurchased += 100;


    await wallet.save();


    // =====================================
    // RESPONSE
    // =====================================

    res.json({

      success: true,

      message:
        "100 test coins added",

      coins:
        wallet.coins

    });


  } catch (err) {

    console.error(
      "TEST ADD COINS ERROR:",
      err
    );

    res.status(500).json({

      success: false,

      message:
        err.message

    });

  }
};
