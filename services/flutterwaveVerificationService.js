const {
    getCharge
} = require("./flutterwaveService");


// =====================================================
// FLUTTERWAVE PAYMENT VERIFICATION SERVICE
// =====================================================
//
// IMPORTANT:
//
// - Wannan service yana VERIFY payment ne kawai.
// - Ba ya ƙara coins.
// - Ba ya canza Wallet.
// - Ba ya canza CoinPurchase zuwa paid.
//
// Credit ɗin coins zai faru ne bayan verification.
// =====================================================


async function verifyFlutterwavePayment({
    purchase
}) {

    // =================================================
    // VALIDATION
    // =================================================

    if (!purchase) {

        throw new Error(
            "Purchase is required for verification."
        );

    }


    if (!purchase.reference) {

        throw new Error(
            "Purchase reference is missing."
        );

    }


    // =================================================
    // CHARGE ID
    // =================================================
    //
    // Mafi kyau mu yi verification da Flutterwave
    // charge ID da muka adana lokacin initialization.
    //
    // =================================================

    const chargeId =
        purchase.flutterwaveChargeId;


    if (!chargeId) {

        throw new Error(
            "Flutterwave charge ID is missing."
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
    // EXTRACT VALUES
    // =================================================

    const providerStatus =
        String(
            charge.status ||
            ""
        )
        .toLowerCase();


    const providerReference =
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
        .toUpperCase();


    const expectedAmount =
        Number(
            purchase.amount
        );


    const expectedCurrency =
        String(
            purchase.currency ||
            "NGN"
        )
        .toUpperCase();


    // =================================================
    // VERIFY REFERENCE
    // =================================================

    if (
        providerReference &&
        providerReference !==
            String(
                purchase.reference
            )
    ) {

        return {

            verified:
                false,

            reason:
                "Payment reference does not match purchase reference.",

            providerStatus,

            providerReference,

            amount,

            currency,

            raw:
                response

        };

    }


    // =================================================
    // VERIFY AMOUNT
    // =================================================

    if (
        !Number.isFinite(amount) ||
        amount !== expectedAmount
    ) {

        return {

            verified:
                false,

            reason:
                "Payment amount does not match purchase amount.",

            providerStatus,

            providerReference,

            amount,

            currency,

            expectedAmount,

            raw:
                response

        };

    }


    // =================================================
    // VERIFY CURRENCY
    // =================================================

    if (
        currency !==
        expectedCurrency
    ) {

        return {

            verified:
                false,

            reason:
                "Payment currency does not match purchase currency.",

            providerStatus,

            providerReference,

            amount,

            currency,

            expectedCurrency,

            raw:
                response

        };

    }


    // =================================================
    // VERIFY SUCCESS STATUS
    // =================================================
    //
    // Payment sai an tabbatar da shi ne idan
    // Flutterwave ya nuna successful/succeeded.
    //
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
            providerStatus
        );


    // =================================================
    // RETURN VERIFICATION RESULT
    // =================================================

    return {

        verified,

        reason:
            verified
                ? null
                : "Flutterwave payment has not been successfully completed.",

        providerStatus,

        providerReference,

        amount,

        currency,

        chargeId:
            charge.id ||
            chargeId,

        raw:
            response

    };

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    verifyFlutterwavePayment

};
