const PAYSTACK_BASE_URL =
    "https://api.paystack.co";


// =====================================================
// GET PAYSTACK SECRET KEY
// =====================================================

function getPaystackSecretKey() {

    const secretKey =
        process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {

        throw new Error(
            "PAYSTACK_SECRET_KEY is not configured."
        );

    }

    return secretKey;
}


// =====================================================
// PAYSTACK REQUEST
// =====================================================

async function paystackRequest(
    endpoint,
    options = {}
) {

    const secretKey =
        getPaystackSecretKey();


    const response =
        await fetch(
            `${PAYSTACK_BASE_URL}${endpoint}`,
            {

                method:
                    options.method ||
                    "GET",

                headers: {

                    Authorization:
                        `Bearer ${secretKey}`,

                    "Content-Type":
                        "application/json"

                },

                body:
                    options.body
                        ? JSON.stringify(
                            options.body
                        )
                        : undefined

            }
        );


    let result;

    try {

        result =
            await response.json();

    } catch (err) {

        throw new Error(
            "Invalid response received from Paystack."
        );

    }


    if (
        !response.ok ||
        result.status !== true
    ) {

        throw new Error(

            result.message ||
            `Paystack request failed with status ${response.status}.`

        );

    }


    return result;

}


// =====================================================
// CONVERT AMOUNT TO SUBUNIT
// =====================================================
//
// Paystack yana amfani da subunit.
// NGN:
// ₦100 = 10000 kobo
//
// =====================================================

function convertToSubunit(
    amount,
    currency = "NGN"
) {

    const numericAmount =
        Number(amount);


    if (
        !Number.isFinite(
            numericAmount
        ) ||
        numericAmount <= 0
    ) {

        throw new Error(
            "Invalid payment amount."
        );

    }


    const normalizedCurrency =
        String(
            currency ||
            "NGN"
        )
        .trim()
        .toUpperCase();


    // Paystack NGN uses Kobo.

    if (
        normalizedCurrency ===
        "NGN"
    ) {

        return Math.round(
            numericAmount * 100
        );

    }


    // Generic subunit handling.
    //
    // Za mu iya ƙara special currency
    // rules daga baya idan 2CHAT
    // ya fara karɓar wasu currencies.

    return Math.round(
        numericAmount * 100
    );

}


// =====================================================
// INITIALIZE PAYSTACK TRANSACTION
// =====================================================

async function initializePaystackTransaction(
    {
        email,
        amount,
        currency = "NGN",
        reference,
        callbackUrl,
        metadata
    }
) {

    if (!email) {

        throw new Error(
            "Customer email is required."
        );

    }


    if (!reference) {

        throw new Error(
            "Payment reference is required."
        );

    }


    const normalizedCurrency =
        String(
            currency ||
            "NGN"
        )
        .trim()
        .toUpperCase();


    const subunitAmount =
        convertToSubunit(
            amount,
            normalizedCurrency
        );


    const body = {

        email:
            String(
                email
            )
            .trim(),

        amount:
            String(
                subunitAmount
            ),

        currency:
            normalizedCurrency,

        reference:
            String(
                reference
            )
            .trim(),

        metadata:
            metadata || {}

    };


    // Callback URL na iya zuwa
    // daga ENV ko daga controller.

    const finalCallbackUrl =
        callbackUrl ||
        process.env.PAYSTACK_CALLBACK_URL;


    if (finalCallbackUrl) {

        body.callback_url =
            finalCallbackUrl;

    }


    const result =
        await paystackRequest(
            "/transaction/initialize",
            {

                method:
                    "POST",

                body

            }
        );


    const data =
        result.data || {};


    if (
        !data.authorization_url
    ) {

        throw new Error(
            "Paystack did not return an authorization URL."
        );

    }


    return {

        authorization_url:
            data.authorization_url,

        access_code:
            data.access_code ||
            null,

        reference:
            data.reference ||
            reference,

        status:
            "initialized"

    };

}


// =====================================================
// VERIFY PAYSTACK TRANSACTION
// =====================================================
//
// Wannan za mu yi amfani da shi daga
// webhook / verification controller.
// =====================================================

async function verifyPaystackTransaction(
    reference
) {

    if (!reference) {

        throw new Error(
            "Payment reference is required for verification."
        );

    }


    const result =
        await paystackRequest(

            `/transaction/verify/${encodeURIComponent(
                reference
            )}`,

            {

                method:
                    "GET"

            }

        );


    return result.data;

}


// =====================================================
// GET PAYSTACK TRANSACTION
// =====================================================

async function getPaystackTransaction(
    reference
) {

    return verifyPaystackTransaction(
        reference
    );

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    initializePaystackTransaction,

    verifyPaystackTransaction,

    getPaystackTransaction,

    convertToSubunit

};
