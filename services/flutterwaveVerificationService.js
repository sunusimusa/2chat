const {
    getCharge
} = require("./flutterwaveService");


// =====================================================
// VERIFY FLUTTERWAVE CHARGE
// =====================================================
//
// IMPORTANT:
//
// - Wannan service verification kawai yake yi.
// - Ba ya ƙara coins.
// - Ba ya canza Wallet.
// - Ba ya canza CoinPurchase zuwa paid.
// - creditCoinPurchase() ne zai yi credit daga baya.
// =====================================================

async function verifyFlutterwaveCharge(
    chargeId
) {

    // =================================================
    // VALIDATION
    // =================================================

    if (!chargeId) {

        throw new Error(
            "Flutterwave charge ID is required."
        );

    }


    // =================================================
    // GET CHARGE FROM FLUTTERWAVE
    // =================================================

    const response =
        await getCharge(
            chargeId
        );


    const charge =
        response?.data;


    if (!charge) {

        throw new Error(
            "Flutterwave charge data was not returned."
        );

    }


    // =================================================
    // EXTRACT PAYMENT DATA
    // =================================================

    const status =
        String(
            charge.status ||
            ""
        )
        .trim()
        .toLowerCase();


    const reference =
        String(
            charge.reference ||
            ""
        )
        .trim();


    const amount =
        Number(
            charge.amount
        );


    const currency =
        String(
            charge.currency ||
            ""
        )
        .trim()
        .toUpperCase();


    // =================================================
    // SUCCESS STATUS
    // =================================================

    const successfulStatuses = [

        "successful",

        "succeeded",

        "success",

        "completed",

        "paid"

    ];


    const verified =
        successfulStatuses.includes(
            status
        );


    // =================================================
    // RESULT
    // =================================================

    return {

        verified,

        status,

        reference,

        amount,

        currency,

        chargeId:
            charge.id ||
            chargeId,

        reason:
            verified
                ? null
                : "Flutterwave payment is not successful.",

        raw:
            response

    };

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    verifyFlutterwaveCharge

};
