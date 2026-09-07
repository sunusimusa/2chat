const crypto =
    require("crypto");

const CoinPurchase =
    require("../models/CoinPurchase");

const {
    verifyPaystackTransaction
} =
    require("../services/paystackService");

const {
    creditCoinPurchase
} =
    require("../services/coinPurchaseCreditService");


// =====================================================
// VERIFY PAYSTACK WEBHOOK SIGNATURE
// =====================================================

function verifyWebhookSignature(
    req
) {

    const secretKey =
        process.env.PAYSTACK_SECRET_KEY;


    if (!secretKey) {

        throw new Error(
            "PAYSTACK_SECRET_KEY is missing."
        );

    }


    const signature =
        req.headers[
            "x-paystack-signature"
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
                "sha512",
                secretKey
            )
            .update(
                rawBody
            )
            .digest(
                "hex"
            );


    const actualBuffer =
        Buffer.from(
            signature,
            "utf8"
        );

    const expectedBuffer =
        Buffer.from(
            expected,
            "utf8"
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
// PAYSTACK WEBHOOK
// =====================================================

exports.paystackWebhook =
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
                "⚠️ Invalid Paystack webhook signature."
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
            payload?.event;


        const payment =
            payload?.data;


        console.log(
            "📩 PAYSTACK WEBHOOK:",
            eventType
        );


        // =========================================
        // ONLY PROCESS CHARGE.SUCCESS
        // =========================================

        if (
            eventType !==
            "charge.success"
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
        // PAYMENT REFERENCE
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


        // =========================================
        // FIND PURCHASE
        // =========================================

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

            console.log(
                "ℹ️ Payment already processed:",
                reference
            );


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
        // VERIFY PAYMENT DIRECTLY WITH PAYSTACK
        // =========================================

        const verifiedPayment =
            await verifyPaystackTransaction(
                reference
            );


        // =========================================
        // VERIFY SUCCESS STATUS
        // =========================================

        if (
            !verifiedPayment ||
            verifiedPayment.status !==
            "success"
        ) {

            console.warn(
                "⚠️ Paystack transaction not successful:",
                reference
            );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Payment not successful."

                });

        }


        // =========================================
        // VERIFY AMOUNT
        // =========================================
        //
        // CoinPurchase amount = NGN
        // Paystack amount = kobo
        //
        // Example:
        //
        // ₦100 = 10000 kobo
        //
        // =========================================

        const expectedAmount =
            Math.round(
                Number(
                    purchase.amount
                ) * 100
            );


        const paidAmount =
            Number(
                verifiedPayment.amount
            );


        if (
            paidAmount !==
            expectedAmount
        ) {

            console.error(
                "❌ Paystack amount mismatch:",
                {
                    reference,
                    expectedAmount,
                    paidAmount
                }
            );


            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "Payment amount mismatch."

                });

        }


        // =========================================
        // VERIFY CURRENCY
        // =========================================

        const expectedCurrency =
            String(
                purchase.currency ||
                "NGN"
            )
                .trim()
                .toUpperCase();


        const paidCurrency =
            String(
                verifiedPayment.currency ||
                ""
            )
                .trim()
                .toUpperCase();


        if (
            paidCurrency !==
            expectedCurrency
        ) {

            console.error(
                "❌ Paystack currency mismatch:",
                {
                    reference,
                    expectedCurrency,
                    paidCurrency
                }
            );


            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "Payment currency mismatch."

                });

        }


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
            "✅ PAYSTACK COINS CREDITED:",
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
            "❌ PAYSTACK WEBHOOK ERROR:",
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
