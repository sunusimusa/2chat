require("dotenv").config();

const mongoose = require("mongoose");

const CoinPackage =
    require("../models/CoinPackage");


const packages = [

    // =====================================================
    // 🇳🇬 NGN PACKAGES
    // $1 = ₦1,300
    // =====================================================

    {
        name: "100 Coins",
        coins: 100,
        price: 1300,
        currency: "NGN",
        sortOrder: 1,
        active: true
    },

    {
        name: "200 Coins",
        coins: 200,
        price: 2600,
        currency: "NGN",
        sortOrder: 2,
        active: true
    },

    {
        name: "300 Coins",
        coins: 300,
        price: 3900,
        currency: "NGN",
        sortOrder: 3,
        active: true
    },

    {
        name: "500 Coins",
        coins: 500,
        price: 6500,
        currency: "NGN",
        sortOrder: 4,
        active: true
    },

    {
        name: "1,000 Coins",
        coins: 1000,
        price: 13000,
        currency: "NGN",
        sortOrder: 5,
        active: true
    },

    {
        name: "1,500 Coins",
        coins: 1500,
        price: 19500,
        currency: "NGN",
        sortOrder: 6,
        active: true
    },

    {
        name: "2,000 Coins",
        coins: 2000,
        price: 26000,
        currency: "NGN",
        sortOrder: 7,
        active: true
    },

    {
        name: "3,000 Coins",
        coins: 3000,
        price: 39000,
        currency: "NGN",
        sortOrder: 8,
        active: true
    },

    {
        name: "4,000 Coins",
        coins: 4000,
        price: 52000,
        currency: "NGN",
        sortOrder: 9,
        active: true
    },

    {
        name: "5,000 Coins",
        coins: 5000,
        price: 65000,
        currency: "NGN",
        sortOrder: 10,
        active: true
    },

    {
        name: "10,000 Coins",
        coins: 10000,
        price: 130000,
        currency: "NGN",
        sortOrder: 11,
        active: true
    },

    {
        name: "20,000 Coins",
        coins: 20000,
        price: 260000,
        currency: "NGN",
        sortOrder: 12,
        active: true
    },


    // =====================================================
    // 🇺🇸 USD PACKAGES
    // $1 = ₦1,300
    // =====================================================

    {
        name: "100 Coins",
        coins: 100,
        price: 1,
        currency: "USD",
        sortOrder: 101,
        active: true
    },

    {
        name: "200 Coins",
        coins: 200,
        price: 2,
        currency: "USD",
        sortOrder: 102,
        active: true
    },

    {
        name: "300 Coins",
        coins: 300,
        price: 3,
        currency: "USD",
        sortOrder: 103,
        active: true
    },

    {
        name: "500 Coins",
        coins: 500,
        price: 5,
        currency: "USD",
        sortOrder: 104,
        active: true
    },

    {
        name: "1,000 Coins",
        coins: 1000,
        price: 10,
        currency: "USD",
        sortOrder: 105,
        active: true
    },

    {
        name: "1,500 Coins",
        coins: 1500,
        price: 15,
        currency: "USD",
        sortOrder: 106,
        active: true
    },

    {
        name: "2,000 Coins",
        coins: 2000,
        price: 20,
        currency: "USD",
        sortOrder: 107,
        active: true
    },

    {
        name: "3,000 Coins",
        coins: 3000,
        price: 30,
        currency: "USD",
        sortOrder: 108,
        active: true
    },

    {
        name: "4,000 Coins",
        coins: 4000,
        price: 40,
        currency: "USD",
        sortOrder: 109,
        active: true
    },

    {
        name: "5,000 Coins",
        coins: 5000,
        price: 50,
        currency: "USD",
        sortOrder: 110,
        active: true
    },

    {
        name: "10,000 Coins",
        coins: 10000,
        price: 100,
        currency: "USD",
        sortOrder: 111,
        active: true
    },

    {
        name: "20,000 Coins",
        coins: 20000,
        price: 200,
        currency: "USD",
        sortOrder: 112,
        active: true
    }

];


async function seedCoinPackages() {

    try {

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "✅ MongoDB connected"
        );


        for (const item of packages) {

            const existing =
                await CoinPackage.findOne({

                    coins:
                        item.coins,

                    currency:
                        item.currency

                });


            if (existing) {

                await CoinPackage.updateOne(

                    {
                        coins:
                            item.coins,

                        currency:
                            item.currency
                    },

                    {
                        $set:
                            item
                    }

                );

                console.log(
                    `🔄 Updated: ${item.name} - ${item.currency}`
                );

            } else {

                await CoinPackage.create(
                    item
                );

                console.log(
                    `✅ Created: ${item.name} - ${item.currency}`
                );

            }

        }


        console.log(
            "🎉 Coin packages seed completed successfully."
        );


        await mongoose.disconnect();

        process.exit(0);


    } catch (err) {

        console.error(
            "❌ COIN PACKAGE SEED ERROR:",
            err
        );

        await mongoose.disconnect();

        process.exit(1);

    }

}


seedCoinPackages();
