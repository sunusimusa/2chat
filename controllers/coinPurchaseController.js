const crypto = require("crypto");

const User =
    require("../models/User");

const CoinPackage =
    require("../models/CoinPackage");

const CoinPurchase =
    require("../models/CoinPurchase");

const {
    initializePaystackTransaction
} =
    require("../services/paystackService");


// =====================================================
// CREATE COIN PURCHASE
// =====================================================

exports.createCoinPurchase = async (
    req,
    res
) => {

    try {

        const userId =
            req.user?._id;

        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }


        const {
            packageId
        } = req.body;


        if (!packageId) {

            return res.status(400).json({

                success: false,

                message:
                    "Package ID is required."

            });

        }


        const coinPackage =
            await CoinPackage.findOne({

                _id:
                    packageId,

                active:
                    true

            });


        if (!coinPackage) {

            return res.status(404).json({

                success: false,

                message:
                    "Coin package not found or unavailable."

            });

        }


        const coins =
            Number(
                coinPackage.coins
            );

        const amount =
            Number(
                coinPackage.price
            );

        const currency =
            String(
                coinPackage.currency ||
                "NGN"
            ).toUpperCase();


        if (
            !Number.isFinite(coins) ||
            coins <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid coin package."

            });

        }


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid package price."

            });

        }


        const reference =
            "2CHAT-" +
            Date.now() +
            "-" +
            crypto
                .randomBytes(4)
                .toString("hex")
                .toUpperCase();


        const purchase =
            await CoinPurchase.create({

                userId,

                packageId:
                    coinPackage._id,

                coins,

                amount,

                currency,

                reference,

                status:
                    "pending",

                paymentProvider:
                    "paystack",

                coinsCredited:
                    false

            });


        return res.status(201).json({

            success: true,

            message:
                "Coin purchase order created successfully.",

            purchase: {

                id:
                    purchase._id,

                reference:
                    purchase.reference,

                packageId:
                    purchase.packageId,

                coins:
                    purchase.coins,

                amount:
                    purchase.amount,

                currency:
                    purchase.currency,

                status:
                    purchase.status,

                paymentProvider:
                    purchase.paymentProvider,

                createdAt:
                    purchase.createdAt

            }

        });


    } catch (err) {

        console.error(
            "CREATE COIN PURCHASE ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to create coin purchase order."

        });

    }

};


// =====================================================
// INITIALIZE PAYSTACK PAYMENT
// =====================================================

exports.initializeCoinPurchasePayment =
async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Purchase ID is required."

            });

        }


        const purchase =
            await CoinPurchase.findById(id);


        if (!purchase) {

            return res.status(404).json({

                success: false,

                message:
                    "Coin purchase order not found."

            });

        }


        if (
            String(
                purchase.userId
            ) !==
            String(
                req.user._id
            )
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to access this purchase."

            });

        }


        if (
    purchase.status !== "pending" &&
    purchase.status !== "processing"
) {

    return res.status(400).json({

        success: false,

        message:
            `Payment cannot be initialized because order status is "${purchase.status}".`

    });

}

        const user =
            await User.findById(
                req.user._id
            )
            .select(
                "username email"
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        if (!user.email) {

            return res.status(400).json({

                success: false,

                message:
                    "User email is required for payment."

            });

        }


        // =================================================
        // INITIALIZE PAYSTACK TRANSACTION
        // =================================================

        const payment =
            await initializePaystackTransaction({

                email:
                    user.email,

                amount:
                    purchase.amount,

                currency:
                    purchase.currency,

                reference:
                    purchase.reference,

                metadata: {

                    purchaseId:
                        String(
                            purchase._id
                        ),

                    userId:
                        String(
                            purchase.userId
                        ),

                    packageId:
                        String(
                            purchase.packageId
                        ),

                    coins:
                        purchase.coins,

                    username:
                        user.username || ""

                }

            });


        if (
            !payment ||
            !payment.authorization_url
        ) {

            throw new Error(
                "Paystack did not return an authorization URL."
            );

        }


        // =================================================
        // SAVE PAYSTACK DATA
        // =================================================

        purchase.paymentProvider =
            "paystack";

        purchase.paymentReference =
            payment.reference ||
            purchase.reference;

        purchase.paystackAccessCode =
            payment.access_code ||
            null;

        purchase.paymentUrl =
            payment.authorization_url;

        purchase.paymentInitializedAt =
            new Date();

        purchase.providerStatus =
            payment.status ||
            "initialized";


        await purchase.save();


        // =================================================
        // RESPONSE
        // =================================================

        return res.json({

            success: true,

            message:
                "Paystack payment initialized successfully.",

            payment: {

                provider:
                    "paystack",

                reference:
                    purchase.paymentReference,

                authorization_url:
                    purchase.paymentUrl,

                access_code:
                    purchase.paystackAccessCode,

                amount:
                    purchase.amount,

                currency:
                    purchase.currency,

                status:
                    purchase.providerStatus

            }

        });


    } catch (err) {

        console.error(
            "INITIALIZE PAYSTACK PAYMENT ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message ||
                "Failed to initialize Paystack payment."

        });

    }

};


// =====================================================
// GET COIN PURCHASE
// =====================================================

exports.getCoinPurchase =
async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Purchase ID is required."

            });

        }


        const purchase =
            await CoinPurchase.findById(id);


        if (!purchase) {

            return res.status(404).json({

                success: false,

                message:
                    "Coin purchase order not found."

            });

        }


        if (
            String(
                purchase.userId
            ) !==
            String(
                req.user._id
            )
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to access this purchase."

            });

        }


        return res.json({

            success: true,

            purchase: {

                id:
                    purchase._id,

                reference:
                    purchase.reference,

                packageId:
                    purchase.packageId,

                coins:
                    purchase.coins,

                amount:
                    purchase.amount,

                currency:
                    purchase.currency,

                paymentProvider:
                    purchase.paymentProvider,

                paymentReference:
                    purchase.paymentReference,

                paystackAccessCode:
                    purchase.paystackAccessCode,

                paystackTransactionId:
                    purchase.paystackTransactionId,

                paymentUrl:
                    purchase.paymentUrl,

                status:
                    purchase.status,

                providerStatus:
                    purchase.providerStatus,

                paymentInitializedAt:
                    purchase.paymentInitializedAt,

                paymentCompletedAt:
                    purchase.paymentCompletedAt,

                paymentVerifiedAt:
                    purchase.paymentVerifiedAt,

                coinsCredited:
                    purchase.coinsCredited,

                createdAt:
                    purchase.createdAt,

                updatedAt:
                    purchase.updatedAt

            }

        });


    } catch (err) {

        console.error(
            "GET COIN PURCHASE ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load coin purchase."

        });

    }

};
