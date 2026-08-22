const CoinPackage = require("../models/CoinPackage");

// =========================================
// GET ACTIVE COIN PACKAGES
// =========================================

exports.getCoinPackages = async (req, res) => {

    try {

        const packages =
            await CoinPackage.find({
                active: true
            })
            .sort({
                sortOrder: 1,
                coins: 1
            })
            .select(
                "name coins price currency sortOrder"
            );


        return res.json({

            success: true,

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

            success: false,

            message:
                "Failed to load coin packages."

        });

    }

};
