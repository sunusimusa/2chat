/**
 * =====================================================
 * 2CHAT
 * FLUTTERWAVE PAYMENT VERIFICATION SERVICE
 * =====================================================
 *
 * Wannan service yana:
 * - karɓar charge ID
 * - zuwa Flutterwave
 * - tabbatar da payment
 * - dawo da reference/amount/currency/status
 *
 * BA ya ƙara coins.
 * BA ya canza Wallet.
 * =====================================================
 */

const {
    getFlutterwaveAccessToken
} = require("./paymentInitializationService");


const FLUTTERWAVE_BASE_URL =
    process.env.FLW_BASE_URL ||
    "https://f4bexperience.flutterwave.com";


// =====================================================
// VERIFY FLUTTERWAVE CHARGE
// =====================================================

async function verifyFlutterwaveCharge(
    chargeId
) {

    if (!chargeId) {

        throw new Error(
            "Flutterwave charge ID is required."
        );

    }

    const accessToken =
        await getFlutterwaveAccessToken();

    const response =
        await fetch(
            `${FLUTTERWAVE_BASE_URL}/charges/${encodeURIComponent(chargeId)}`,
            {

                method:
                    "GET",

                headers: {

                    "Authorization":
                        `Bearer ${accessToken}`,

                    "Accept":
                        "application/json"

                }

            }
        );

    const data =
        await response.json();

    if (!response.ok) {

        console.error(
            "FLUTTERWAVE VERIFY ERROR:",
            data
        );

        throw new Error(
            data?.message ||
            data?.error?.message ||
            data?.error ||
            "Failed to verify Flutterwave payment."
        );

    }

    const charge =
        data?.data;

    if (!charge) {

        throw new Error(
            "Flutterwave verification data is missing."
        );

    }

    const status =
        String(
            charge.status ||
            ""
        ).toLowerCase();

    const reference =
        String(
            charge.reference ||
            ""
        ).trim();

    const amount =
        Number(
            charge.amount
        );

    const currency =
        String(
            charge.currency ||
            ""
        ).toUpperCase();

    return {

        id:
            charge.id ||
            chargeId,

        reference,

        amount,

        currency,

        status,

        customerId:
            charge.customer_id ||
            charge.customer?.id ||
            null,

        raw:
            data

    };

}


// =====================================================
// CHECK SUCCESS STATUS
// =====================================================

function isSuccessfulFlutterwavePayment(
    status
) {

    const successfulStatuses = [

        "successful",
        "succeeded",
        "success",
        "completed",
        "paid"

    ];

    return successfulStatuses.includes(
        String(
            status || ""
        ).toLowerCase()
    );

}


// =====================================================
// VERIFY AGAINST PURCHASE
// =====================================================

async function verifyPaymentForPurchase({
    purchase,
    chargeId
}) {

    if (!purchase) {

        throw new Error(
            "Purchase is required."
        );

    }

    if (!chargeId) {

        throw new Error(
            "Charge ID is required."
        );

    }

    const payment =
        await verifyFlutterwaveCharge(
            chargeId
        );

    if (
        String(
            payment.reference
        ) !==
        String(
            purchase.reference
        )
    ) {

        return {

            verified:
                false,

            reason:
                "Payment reference does not match purchase.",

            payment

        };

    }

    const expectedAmount =
        Number(
            purchase.amount
        );

    if (
        !Number.isFinite(
            payment.amount
        ) ||
        payment.amount !==
        expectedAmount
    ) {

        return {

            verified:
                false,

            reason:
                "Payment amount does not match purchase amount.",

            payment

        };

    }

    const expectedCurrency =
        String(
            purchase.currency ||
            "NGN"
        ).toUpperCase();

    if (
        payment.currency !==
        expectedCurrency
    ) {

        return {

            verified:
                false,

            reason:
                "Payment currency does not match purchase currency.",

            payment

        };

    }

    const successful =
        isSuccessfulFlutterwavePayment(
            payment.status
        );

    return {

        verified:
            successful,

        reason:
            successful
                ? null
                : "Flutterwave payment has not been successfully completed.",

        payment

    };

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    verifyFlutterwaveCharge,

    verifyPaymentForPurchase,

    isSuccessfulFlutterwavePayment

};
