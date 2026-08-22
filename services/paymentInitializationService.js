const crypto = require("crypto");


// =====================================================
// PAYMENT INITIALIZATION SERVICE
// =====================================================
//
// Wannan service yana shirya payment initialization.
//
// IMPORTANT:
// - Ba ya ƙara coins.
// - Ba ya canza wallet.
// - Ba ya tabbatar da payment.
// - Verification/webhook ne zai yi hakan daga baya.
//
// Daga baya za mu iya maye gurbin
// initializePayment() da Paystack ko Flutterwave.
// =====================================================


async function initializePayment({
    purchase,
    user
}) {

    // =========================================
    // VALIDATION
    // =========================================

    if (!purchase) {

        throw new Error(
            "Purchase is required"
        );

    }


    if (!user) {

        throw new Error(
            "User is required"
        );

    }


    if (
        purchase.status !==
        "pending"
    ) {

        throw new Error(
            `Payment cannot be initialized because order status is "${purchase.status}".`
        );

    }


    if (!purchase.reference) {

        throw new Error(
            "Purchase reference is missing."
        );

    }


    if (
        !purchase.amount ||
        purchase.amount <= 0
    ) {

        throw new Error(
            "Invalid purchase amount."
        );

    }


    // =========================================
    // PAYMENT REFERENCE
    // =========================================

    const paymentReference =
        purchase.reference;


    // =========================================
    // CUSTOMER EMAIL
    // =========================================

    const email =
        user.email;


    if (!email) {

        throw new Error(
            "User email is required for payment."
        );

    }


    // =========================================
    // PAYMENT PAYLOAD
    // =========================================
    //
    // Wannan shi ne generic payload.
    //
    // Daga baya Paystack/Flutterwave service
    // zai yi amfani da waɗannan values.
    //

    const payload = {

        reference:
            paymentReference,

        amount:
            Number(
                purchase.amount
            ),

        currency:
            purchase.currency ||
            "NGN",

        email,

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
                Number(
                    purchase.coins
                )

        }

    };


    // =========================================
    // TEMPORARY PAYMENT INITIALIZATION
    // =========================================
    //
    // Ba mu kira real payment provider ba tukuna.
    //
    // Wannan temporary response ne domin mu iya
    // gwada complete order flow.
    //

    const initializationId =
        crypto
            .randomBytes(16)
            .toString("hex");


    return {

        success:
            true,

        provider:
            purchase.paymentProvider ||
            "test",

        initializationId,

        reference:
            paymentReference,

        amount:
            payload.amount,

        currency:
            payload.currency,

        email:
            payload.email,

        metadata:
            payload.metadata,

        // Daga baya wannan zai zama
        // Paystack/Flutterwave checkout URL.
        checkoutUrl:
            null,

        status:
            "initialized"

    };

}


// =====================================================
// EXPORT
// =====================================================

module.exports =
    initializePayment;
