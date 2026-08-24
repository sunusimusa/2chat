const CoinPackage =
  require("../models/CoinPackage");


// =====================================================
// 2CHAT
// GET ACTIVE COIN PACKAGES
// =====================================================
//
// Wannan endpoint yana dawo da packages da user zai
// iya saya.
//
// IMPORTANT:
//
// - Ba ya ƙirƙirar purchase.
// - Ba ya fara Flutterwave payment.
// - Ba ya canza Wallet.
// - Yana dawo da active packages kawai.
// =====================================================

exports.getCoinPackages =
async (
  req,
  res
) => {

  try {

    // =================================================
    // FIND ACTIVE PACKAGES
    // =================================================

    const packages =
      await CoinPackage.find({

        active:
          true

      })
      .sort({

        sortOrder:
          1,

        coins:
          1

      })
      .select(

        "name coins price currency sortOrder"

      )
      .lean();


    // =================================================
    // RESPONSE
    // =================================================

    return res.json({

      success:
        true,

      count:
        packages.length,

      packages

    });


  } catch (err) {

    console.error(
      "GET COIN PACKAGES ERROR:",
      err
    );


    return res.status(500).json({

      success:
        false,

      message:
        "Failed to load coin packages."

    });

  }

};
