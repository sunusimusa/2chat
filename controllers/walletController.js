const Wallet = require("../models/Wallet");


// =========================================
// GET OR CREATE WALLET
// =========================================
// Wannan yana taimakawa legacy users:
//
// User yana nan
// Wallet babu
// → API ta ƙirƙiri Wallet automatically
//
// Ba sai user ya sake register ba.
//

async function getOrCreateWallet(userId) {

  if (!userId) {
    throw new Error("User ID is required");
  }


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
        // USER COINS
        // =================================

        coins:
          Number(wallet.coins || 0),

        totalPurchased:
          Number(wallet.totalPurchased || 0),

        totalSpent:
          Number(wallet.totalSpent || 0),


        // =================================
        // CREATOR EARNINGS
        // =================================

        totalEarned:
          Number(wallet.totalEarned || 0),

        platformCommission:
          Number(wallet.platformCommission || 0),

        availableBalance:
          Number(wallet.availableBalance || 0),

        withdrawalLockedBalance:
          Number(
            wallet.withdrawalLockedBalance || 0
          ),

        totalWithdrawn:
          Number(wallet.totalWithdrawn || 0),


        // =================================
        // GIFTS
        // =================================

        giftsSent:
          Number(wallet.giftsSent || 0),

        giftsReceived:
          Number(wallet.giftsReceived || 0),


        // =================================
        // BACKWARD COMPATIBILITY
        // =================================
        // Wasu tsoffin pages na iya amfani
        // da "balance".
        //
        // Source of truth:
        // availableBalance

        balance:
          Number(wallet.availableBalance || 0)

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
        "Failed to load wallet."

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
    // FINANCIAL VALUES
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
        Math.max(
          0,
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
    // RESPONSE
    // =====================================

    return res.json({

      success: true,

      earnings: {

        // Gross gift value
        totalEarned:
          grossAmount,

        // 1 coin = ₦1
        grossAmount:
          grossAmount,

        // Platform commission
        platformCommission:
          platformCommission,

        // Creator share
        creatorShare:
          creatorShare,

        // Available for withdrawal
        availableBalance:
          availableBalance,

        // Locked by withdrawal
        withdrawalLockedBalance:
          withdrawalLockedBalance,

        // Already withdrawn
        totalWithdrawn:
          totalWithdrawn,

        // Gift count
        giftsReceived:
          Number(
            wallet.giftsReceived || 0
          )

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
        "Failed to load earnings."

    });

  }

};


// =========================================
// EXPORT HELPER
// =========================================
// Gifts / withdrawals za iya amfani da
// wannan helper daga baya idan muna buƙata.

exports.getOrCreateWallet =
  getOrCreateWallet;
