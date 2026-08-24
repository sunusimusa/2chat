const crypto = require("crypto");

const User =
    require("../models/User");

const CoinPackage =
    require("../models/CoinPackage");

const CoinPurchase =
    require("../models/CoinPurchase");

const {
    initializePayment,
    createPaymentMethod
} =
    require("../services/paymentInitializationService");


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
                    "flutterwave",

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
// CREATE PAYMENT METHOD
// =====================================================

exports.createCoinPaymentMethod =
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


        const {
            card
        } = req.body || {};


        if (!card) {

            return res.status(400).json({

                success: false,

                message:
                    "Card payment data is required."

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
            purchase.status !==
            "pending"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Payment cannot continue because order status is "${purchase.status}".`

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


        const paymentMethod =
            await createPaymentMethod({

                user,

                card

            });


        if (
            paymentMethod.customerId
        ) {

            purchase.flutterwaveCustomerId =
                String(
                    paymentMethod.customerId
                );

        }


        if (
            paymentMethod.id
        ) {

            purchase.flutterwavePaymentMethodId =
                String(
                    paymentMethod.id
                );

        }


        purchase.paymentProvider =
            "flutterwave";


        await purchase.save();


        return res.json({

            success: true,

            message:
                "Flutterwave payment method created successfully.",

            paymentMethod: {

                id:
                    paymentMethod.id,

                type:
                    paymentMethod.type,

                card:
                    paymentMethod.card,

                customerId:
                    paymentMethod.customerId

            }

        });


    } catch (err) {

        console.error(
            "CREATE COIN PAYMENT METHOD ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message ||
                "Failed to create payment method."

        });

    }

};


// =====================================================
// INITIALIZE PAYMENT
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
            purchase.status !==
            "pending"
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


        const paymentMethodId =
            purchase.flutterwavePaymentMethodId;


        if (!paymentMethodId) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment method has not been created. Please enter your card details first."

            });

        }


        const payment =
            await initializePayment({

                purchase,

                user,

                paymentMethodId

            });


        purchase.paymentReference =
            payment.reference;


        purchase.paymentInitializedAt =
            new Date();


        if (
            payment.customerId
        ) {

            purchase.flutterwaveCustomerId =
                String(
                    payment.customerId
                );

        }


        if (
            payment.chargeId
        ) {

            purchase.flutterwaveChargeId =
                String(
                    payment.chargeId
                );

        }


        purchase.providerStatus =
            payment.status;


        await purchase.save();


        return res.json({

            success: true,

            message:
                "Flutterwave payment initialized successfully.",

            payment

        });


    } catch (err) {

        console.error(
            "INITIALIZE COIN PAYMENT ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message ||
                "Failed to initialize Flutterwave payment."

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
