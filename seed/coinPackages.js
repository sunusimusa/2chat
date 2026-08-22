require("dotenv").config();

const mongoose = require("mongoose");

const CoinPackage =
    require("../models/CoinPackage");


const packages = [

    {
        name: "100 Coins",
        coins: 100,
        price: 100,
        currency: "NGN",
        sortOrder: 1
    },

    {
        name: "200 Coins",
        coins: 200,
        price: 200,
        currency: "NGN",
        sortOrder: 2
    },

    {
        name: "300 Coins",
        coins: 300,
        price: 300,
        currency: "NGN",
        sortOrder: 3
    },

    {
        name: "500 Coins",
        coins: 500,
        price: 500,
        currency: "NGN",
        sortOrder: 4
    },

    {
        name: "1,000 Coins",
        coins: 1000,
        price: 1000,
        currency: "NGN",
        sortOrder: 5
    },

    {
        name: "1,500 Coins",
        coins: 1500,
        price: 1500,
        currency: "NGN",
        sortOrder: 6
    },

    {
        name: "2,000 Coins",
        coins: 2000,
        price: 2000,
        currency: "NGN",
        sortOrder: 7
    },

    {
        name: "3,000 Coins",
        coins: 3000,
        price: 3000,
        currency: "NGN",
        sortOrder: 8
    },

    {
        name: "4,000 Coins",
        coins: 4000,
        price: 4000,
        currency: "NGN",
        sortOrder: 9
    },

    {
        name: "5,000 Coins",
        coins: 5000,
        price: 5000,
        currency: "NGN",
        sortOrder: 10
    },

    {
        name: "10,000 Coins",
        coins: 10000,
        price: 10000,
        currency: "NGN",
        sortOrder: 11
    },

    {
        name: "20,000 Coins",
        coins: 20000,
        price: 20000,
        currency: "NGN",
        sortOrder: 12
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
                    coins: item.coins
                });


            if (existing) {

                await CoinPackage.updateOne(
                    {
                        coins: item.coins
                    },
                    {
                        $set: item
                    }
                );

                console.log(
                    `🔄 Updated: ${item.name}`
                );

            } else {

                await CoinPackage.create(
                    item
                );

                console.log(
                    `✅ Created: ${item.name}`
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
