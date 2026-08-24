/**
 * =====================================================
 * 2CHAT
 * FLUTTERWAVE LIVE V4 PAYMENT VERIFICATION SERVICE
 * =====================================================
 */

const {
    getFlutterwaveAccessToken
} = require("./paymentInitializationService");


const FLUTTERWAVE_BASE_URL =
    process.env.FLW_BASE_URL ||
    "https://f4bexperience.flutterwave.com";


// =====================================================
// VERIFY CHARGE
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

                method: "GET",

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

    return {

        id:
            charge.id ||
            chargeId,

        reference:
            String(
                charge.reference ||
                ""
            ).trim(),

        amount:
            Number(
                charge.amount
            ),

        currency:
            String(
                charge.currency ||
                ""
            ).toUpperCase(),

        status:
            String(
                charge.status ||
                ""
            ).toLowerCase(),

        customerId:
            charge.customer_id ||
            charge.customer?.id ||
            null,

        raw:
            data
    };
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    verifyFlutterwaveCharge
};
