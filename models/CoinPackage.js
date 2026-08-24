const mongoose = require("mongoose");


// =====================================================
// 2CHAT
// COIN PACKAGE MODEL
// =====================================================
//
// Wannan model yana riƙe da packages da user zai iya
// saya daga Buy Coins / Wallet.
//
// PAYMENT FLOW:
//
// CoinPackage
//      ↓
// CoinPurchase
//      ↓
// Flutterwave
//
// IMPORTANT:
//
// - price = amount da za a biya.
// - coins = adadin coins da user zai samu.
// - currency = currency na payment.
// - active = ko package yana samuwa.
// - CoinPurchase zai snapshot coins/price/currency
//   lokacin da aka ƙirƙiri order.
// =====================================================


const coinPackageSchema =
  new mongoose.Schema(

    {

      // =================================================
      // PACKAGE NAME
      // =================================================

      name: {

        type:
          String,

        required:
          true,

        trim:
          true

      },


      // =================================================
      // COINS
      // =================================================
      //
      // Adadin coins da user zai samu.
      //
      // Misali:
      //
      // 100 coins
      // 500 coins
      // 1000 coins
      //
      // =================================================

      coins: {

        type:
          Number,

        required:
          true,

        min:
          1

      },


      // =================================================
      // PRICE
      // =================================================
      //
      // A tsarinmu na yanzu:
      //
      // 1 Coin = ₦1
      //
      // Misali:
      //
      // coins = 100
      // price = 100
      //
      // =================================================

      price: {

        type:
          Number,

        required:
          true,

        min:
          0

      },


      // =================================================
      // CURRENCY
      // =================================================

      currency: {

        type:
          String,

        default:
          "NGN",

        uppercase:
          true,

        trim:
          true

      },


      // =================================================
      // ACTIVE
      // =================================================
      //
      // true:
      //   Package yana samuwa.
      //
      // false:
      //   Package ba zai iya zama sabon purchase ba.
      //
      // =================================================

      active: {

        type:
          Boolean,

        default:
          true,

        index:
          true

      },


      // =================================================
      // SORT ORDER
      // =================================================
      //
      // Wannan yana taimakawa wajen tsara packages
      // a Buy Coins page.
      //
      // =================================================

      sortOrder: {

        type:
          Number,

        default:
          0,

        index:
          true

      }

    },


    {
      timestamps:
        true
    }

  );


// =====================================================
// INDEX
// =====================================================
//
// Active packages + sorting.
//

coinPackageSchema.index({

  active:
    1,

  sortOrder:
    1

});


// =====================================================
// EXPORT
// =====================================================

module.exports =
  mongoose.model(
    "CoinPackage",
    coinPackageSchema
  );
