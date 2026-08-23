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
// CREATE COIN PURCHASE ORDER
// =====================================================

exports.createCoinPurchase = async (
    req,
    res
) => {

    try {

        // =========================================
        // AUTHENTICATED USER
        // =========================================

        const userId =
            req.user?._id;


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }


        // =========================================
        // PACKAGE ID
        // =========================================

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


        // =========================================
        // FIND ACTIVE PACKAGE
        // =========================================

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


        // =========================================
        // SNAPSHOT PACKAGE VALUES
        // =========================================

        const coins =
            Number(
                coinPackage.coins
            );


        const amount =
            Number(
                coinPackage.price
            );


        const currency =
            coinPackage.currency ||
            "NGN";


        // =========================================
        // VALIDATE COINS
        // =========================================

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


        // =========================================
        // VALIDATE PRICE
        // =========================================

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


        // =========================================
        // CREATE UNIQUE REFERENCE
        // =========================================

        const reference =
            "2CHAT-" +
            Date.now() +
            "-" +
            crypto
                .randomBytes(4)
                .toString("hex")
                .toUpperCase();


        // =========================================
        // CREATE PURCHASE
        // =========================================

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
                    "flutterwave"

            });


        // =========================================
        // RESPONSE
        // =========================================

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
// INITIALIZE COIN PURCHASE PAYMENT
// =====================================================

exports.initializeCoinPurchasePayment =
async (
    req,
    res
) => {

    try {

        // =========================================
        // PURCHASE ID
        // =========================================

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


        // =========================================
        // PAYMENT METHOD ID
        // =========================================

        const {
            paymentMethodId
        } = req.body || {};


        if (!paymentMethodId) {

            return res.status(400).json({

                success: false,

                message:
                    "Flutterwave payment method ID is required."

            });

        }


        // =========================================
        // FIND PURCHASE
        // =========================================

        const purchase =
            await CoinPurchase.findById(id);


        if (!purchase) {

            return res.status(404).json({

                success: false,

                message:
                    "Coin purchase order not found."

            });

        }


        // =========================================
        // OWNERSHIP CHECK
        // =========================================

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


        // =========================================
        // STATUS CHECK
        // =========================================

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


        // =========================================
        // GET USER
        // =========================================

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


        // =========================================
        // EMAIL CHECK
        // =========================================

        if (!user.email) {

            return res.status(400).json({

                success: false,

                message:
                    "Your account does not have an email address. Please add an email before making a payment."

            });

        }


        // =========================================
        // SAVE PAYMENT METHOD ID
        // =========================================

        purchase.flutterwavePaymentMethodId =
            String(
                paymentMethodId
            );


        purchase.paymentProvider =
            "flutterwave";


        await purchase.save();


        // =========================================
        // INITIALIZE FLUTTERWAVE PAYMENT
        // =========================================

        const payment =
            await initializePayment({

                purchase,

                user,

                paymentMethodId:
                    String(
                        paymentMethodId
                    )

            });


        // =========================================
        // SAVE PAYMENT DETAILS
        // =========================================

        purchase.paymentReference =
            payment.reference;


        purchase.paymentInitializedAt =
            new Date();


        if (
            payment.chargeId
        ) {

            purchase.flutterwaveChargeId =
                String(
                    payment.chargeId
                );

        }


        // =========================================
        // IMPORTANT
        // =========================================
        //
        // Kada mu canza status zuwa paid.
        //
        // Webhook + verification ne za su
        // tabbatar da payment.
        //
        // =========================================

        await purchase.save();


        // =========================================
        // RESPONSE
        // =========================================

        return res.json({

            success: true,

            message:
                "Flutterwave payment initialized successfully.",

            payment: {

                provider:
                    payment.provider,

                reference:
                    payment.reference,

                amount:
                    payment.amount,

                currency:
                    payment.currency,

                email:
                    payment.email,

                customerId:
                    payment.customerId,

                paymentMethodId:
                    payment.paymentMethodId,

                chargeId:
                    payment.chargeId,

                checkoutUrl:
                    payment.paymentUrl ||
                    payment.checkoutUrl ||
                    null,

                nextAction:
                    payment.nextAction,

                status:
                    payment.status

            }

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
// CREATE COIN PAYMENT METHOD
// =====================================================
//
// Controller baya kiran Flutterwave API kai tsaye.
// Service ne zai yi wannan aikin.
// =====================================================

exports.createCoinPaymentMethod =
async (
    req,
    res
) => {

    try {

        // =========================================
        // PURCHASE ID
        // =========================================

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


        // =========================================
        // CARD DATA
        // =========================================

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


        // =========================================
        // FIND PURCHASE
        // =========================================

        const purchase =
            await CoinPurchase.findById(id);


        if (!purchase) {

            return res.status(404).json({

                success: false,

                message:
                    "Coin purchase order not found."

            });

        }


        // =========================================
        // OWNERSHIP CHECK
        // =========================================

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


        // =========================================
        // STATUS CHECK
        // =========================================

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


        // =========================================
        // GET USER
        // =========================================

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


        // =========================================
        // EMAIL CHECK
        // =========================================

        if (!user.email) {

            return res.status(400).json({

                success: false,

                message:
                    "User email is required."

            });

        }


        // =========================================
        // CREATE PAYMENT METHOD
        // =========================================
        //
        // Flutterwave logic yana cikin service.
        //
        // =========================================

        const paymentMethod =
            await createPaymentMethod({

                user,

                card

            });


        // =========================================
        // SAVE CUSTOMER
        // =========================================

        if (
            paymentMethod.customerId
        ) {

            purchase.flutterwaveCustomerId =
                String(
                    paymentMethod.customerId
                );

        }


        // =========================================
        // SAVE PAYMENT METHOD ID
        // =========================================

        if (
            paymentMethod.id
        ) {

            purchase.flutterwavePaymentMethodId =
                String(
                    paymentMethod.id
                );

        }


        await purchase.save();


        // =========================================
        // RESPONSE
        // =========================================

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
