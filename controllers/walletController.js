const Wallet = require("../models/Wallet");


// =========================================
// CREATE WALLET IF MISSING
// =========================================

async function getOrCreateWallet(userId) {

  let wallet = await Wallet.findOne({
    userId
  });

  if (!wallet) {

    wallet = await Wallet.create({

      userId,

      coins: 0,

      totalPurchased: 0,

      totalSpent: 0,

      totalEarned: 0,

      platformCommission: 0,

      availableBalance: 0,

      withdrawalLockedBalance: 0,

      totalWithdrawn: 0,

      giftsSent: 0,

      giftsReceived: 0

    });

  }

  return wallet;
}



// =========================================
// GET WALLET
// =========================================

exports.getWallet = async (req, res) => {

  try {

    const wallet =
      await getOrCreateWallet(
        req.user._id
      );


    return res.json({

      success: true,

      wallet: {

        // =================================
        // SPENDER COINS
        // =================================

        coins:
          wallet.coins || 0,

        totalPurchased:
          wallet.totalPurchased || 0,

        totalSpent:
          wallet.totalSpent || 0,


        // =================================
        // CREATOR EARNINGS
        // =================================

        // Gross gift value in COINS
        totalEarned:
          wallet.totalEarned || 0,

        // Platform 30% commission in ₦
        platformCommission:
          wallet.platformCommission || 0,

        // Creator's current available money in ₦
        availableBalance:
          wallet.availableBalance || 0,

        // Money temporarily locked for withdrawal
        withdrawalLockedBalance:
          wallet.withdrawalLockedBalance || 0,

        // Money already withdrawn in ₦
        totalWithdrawn:
          wallet.totalWithdrawn || 0,


        // =================================
        // GIFT STATISTICS
        // =================================

        giftsSent:
          wallet.giftsSent || 0,

        giftsReceived:
          wallet.giftsReceived || 0,


        // =================================
        // BACKWARD COMPATIBILITY
        // =================================

        balance:
          wallet.availableBalance || 0

      }

    });

  } catch (err) {

    console.error(
      "GET WALLET ERROR:",
      err
    );

    return res.status(500).json({

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

    const wallet =
      await getOrCreateWallet(
        req.user._id
      );


    // =====================================
    // IMPORTANT
    // =====================================
    // totalEarned is stored as COINS.
    //
    // 1 coin = ₦1
    //
    // Therefore gross gift value in ₦
    // is numerically equal to totalEarned.
    //
    // Example:
    //
    // 645 coins = ₦645 gross
    //
    // =====================================

    const grossAmount =
      Number(
        wallet.totalEarned || 0
      );


    const platformCommission =
      Number(
        wallet.platformCommission || 0
      );


    const creatorShare =
      Number(
        (
          grossAmount -
          platformCommission
        ).toFixed(2)
      );


    const availableBalance =
      Number(
        wallet.availableBalance || 0
      );


    const withdrawalLockedBalance =
      Number(
        wallet.withdrawalLockedBalance || 0
      );


    const totalWithdrawn =
      Number(
        wallet.totalWithdrawn || 0
      );


    // =====================================
    // RETURN EARNINGS
    // =====================================

    return res.json({

      success: true,

      earnings: {

        // -------------------------------
        // GROSS
        // -------------------------------

        // Kept for backward compatibility.
        // This remains the gross gift value
        // in coins.

        totalEarned:
          grossAmount,


        // Gross value expressed in Naira.
        grossAmount:
          grossAmount,


        // -------------------------------
        // PLATFORM
        // -------------------------------

        platformCommission:
          platformCommission,


        // -------------------------------
        // CREATOR
        // -------------------------------

        creatorShare:
          creatorShare,


        // Current withdrawable balance

        availableBalance:
          availableBalance,


        // Currently locked withdrawal money

        withdrawalLockedBalance:
          withdrawalLockedBalance,


        // Already withdrawn

        totalWithdrawn:
          totalWithdrawn,


        // -------------------------------
        // GIFTS
        // -------------------------------

        giftsReceived:
          wallet.giftsReceived || 0

      }

    });

  } catch (err) {

    console.error(
      "GET EARNINGS ERROR:",
      err
    );

    return res.status(500).json({

      success: false,

      message:
        err.message

    });

  }

};



// =========================================
// TEST ADD COINS
// =========================================
// DEVELOPMENT / TEST ONLY
// =========================================

exports.testAddCoins = async (req, res) => {

  try {

    const wallet =
      await getOrCreateWallet(
        req.user._id
      );


    // =====================================
    // ADD 100 TEST COINS
    // =====================================

    wallet.coins += 100;

    wallet.totalPurchased += 100;


    await wallet.save();


    return res.json({

      success: true,

      message:
        "100 test coins added",

      coins:
        wallet.coins,

      totalPurchased:
        wallet.totalPurchased

    });

  } catch (err) {

    console.error(
      "TEST ADD COINS ERROR:",
      err
    );

    return res.status(500).json({

      success: false,

      message:
        err.message

    });

  }

};
