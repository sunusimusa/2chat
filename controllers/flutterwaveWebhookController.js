const crypto =
    require("crypto");

const CoinPurchase =
    require("../models/CoinPurchase");

const {
    verifyFlutterwaveCharge
} =
    require("./services/flutterwaveVerificationService");

const {
    creditCoinPurchase
} =
    require("../services/coinPurchaseCreditService");


// =====================================================
// VERIFY WEBHOOK SIGNATURE
// =====================================================

function verifyWebhookSignature(
    req
) {

    const secretHash =
        process.env.FLW_SECRET_HASH;


    if (!secretHash) {

        throw new Error(
            "FLW_SECRET_HASH is missing."
        );

    }


    const signature =
        req.headers[
            "flutterwave-signature"
        ];


    if (!signature) {

        return false;

    }


    const rawBody =
        req.rawBody;


    if (!rawBody) {

        return false;

    }


    const expected =
        crypto
            .createHmac(
                "sha256",
                secretHash
            )
            .update(
                rawBody
            )
            .digest(
                "base64"
            );


    const actualBuffer =
        Buffer.from(
            signature
        );

    const expectedBuffer =
        Buffer.from(
            expected
        );


    if (
        actualBuffer.length !==
        expectedBuffer.length
    ) {

        return false;

    }


    return crypto.timingSafeEqual(
        actualBuffer,
        expectedBuffer
    );

}


// =====================================================
// FLUTTERWAVE WEBHOOK
// =====================================================

exports.flutterwaveWebhook =
async (
    req,
    res
) => {

    try {

        // =========================================
        // VERIFY SIGNATURE
        // =========================================

        const valid =
            verifyWebhookSignature(
                req
            );


        if (!valid) {

            console.warn(
                "⚠️ Invalid Flutterwave webhook signature."
            );


            return res
                .status(401)
                .json({

                    success:
                        false,

                    message:
                        "Invalid webhook signature."

                });

        }


        // =========================================
        // PAYLOAD
        // =========================================

        const payload =
            req.body;


        const eventType =
            payload?.type;


        const payment =
            payload?.data;


        console.log(
            "📩 FLUTTERWAVE WEBHOOK:",
            eventType
        );


        // =========================================
        // ONLY PROCESS CHARGE COMPLETED
        // =========================================

        if (
            eventType !==
            "charge.completed"
        ) {

            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Webhook received."

                });

        }


        if (!payment) {

            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Webhook data missing."

                });

        }


        // =========================================
        // CHARGE ID
        // =========================================

        const chargeId =
            payment.id;


        if (!chargeId) {

            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Charge ID missing."

                });

        }


        // =========================================
        // FIND PURCHASE
        // =========================================
        //
        // First try reference.
        // This is our own 2Chat reference.
        //
        // =========================================

        const reference =
            payment.reference;


        if (!reference) {

            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Payment reference missing."

                });

        }


        const purchase =
            await CoinPurchase.findOne({
                reference
            });


        if (!purchase) {

            console.warn(
                "⚠️ Coin purchase not found:",
                reference
            );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Purchase not found."

                });

        }


        // =========================================
        // ALREADY CREDITED
        // =========================================

        if (
            purchase.coinsCredited ===
            true
        ) {

            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Payment already processed."

                });

        }


        // =========================================
        // VERIFY WITH FLUTTERWAVE
        // =========================================

        const verifiedPayment =
            await verifyFlutterwaveCharge(
                chargeId
            );


        // =========================================
        // CREDIT COINS
        // =========================================

        await creditCoinPurchase(
            purchase._id,
            verifiedPayment
        );


        // =========================================
        // SUCCESS
        // =========================================

        console.log(
            "✅ COINS CREDITED:",
            purchase.reference,
            purchase.coins
        );


        return res
            .status(200)
            .json({

                success:
                    true,

                message:
                    "Payment verified and coins credited."

            });


    } catch (err) {

        console.error(
            "❌ FLUTTERWAVE WEBHOOK ERROR:",
            err
        );


        return res
            .status(500)
            .json({

                success:
                    false,

                message:
                    "Webhook processing failed."

            });

    }

};
