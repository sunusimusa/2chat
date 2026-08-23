// =====================================================
// FLUTTERWAVE LIVE V4 PAYMENT INITIALIZATION SERVICE
// =====================================================
//
// IMPORTANT:
//
// - Wannan service yana amfani da Flutterwave Live v4.
// - Ba ya ƙara coins.
// - Ba ya canza Wallet.
// - Ba ya saka purchase zuwa "paid".
// - Webhook + verification ne za su tabbatar da payment.
//
// NOTE:
// Flutterwave v4 /charges yana buƙatar:
//   customer_id
//   payment_method_id
//   amount
//   currency
//   reference
//
// Saboda haka ba za mu ƙirƙiri paymentMethodId na ƙarya ba.
// =====================================================


// =====================================================
// ENVIRONMENT
// =====================================================

const FLUTTERWAVE_BASE_URL =
    process.env.FLW_BASE_URL ||
    "https://api.flutterwave.com";


const FLUTTERWAVE_TOKEN_URL =
    "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";


// =====================================================
// GET FLUTTERWAVE ACCESS TOKEN
// =====================================================

async function getFlutterwaveAccessToken() {

    const clientId =
        process.env.FLW_CLIENT_ID;

    const clientSecret =
        process.env.FLW_CLIENT_SECRET;


    if (!clientId) {

        throw new Error(
            "FLW_CLIENT_ID is missing."
        );

    }


    if (!clientSecret) {

        throw new Error(
            "FLW_CLIENT_SECRET is missing."
        );

    }


    const body =
        new URLSearchParams({

            client_id:
                clientId,

            client_secret:
                clientSecret,

            grant_type:
                "client_credentials"

        });


    const response =
        await fetch(
            FLUTTERWAVE_TOKEN_URL,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/x-www-form-urlencoded"

                },

                body:
                    body.toString()

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        console.error(
            "FLUTTERWAVE TOKEN ERROR:",
            data
        );


        throw new Error(
            data?.error_description ||
            data?.message ||
            "Failed to obtain Flutterwave access token."
        );

    }


    if (!data?.access_token) {

        throw new Error(
            "Flutterwave access token was not returned."
        );

    }


    return data.access_token;

}


// =====================================================
// CREATE FLUTTERWAVE CUSTOMER
// =====================================================

async function createFlutterwaveCustomer({

    accessToken,

    user

}) {

    if (!user?.email) {

        throw new Error(
            "User email is required."
        );

    }


    const username =
        String(
            user.username ||
            "2Chat User"
        ).trim();


    const nameParts =
        username
            .split(/\s+/)
            .filter(Boolean);


    const firstName =
        nameParts[0] ||
        "2Chat";


    const lastName =
        nameParts
            .slice(1)
            .join(" ") ||
        "User";


    const payload = {

        name: {

            first:
                firstName,

            last:
                lastName

        },

        email:
            user.email

    };


    const response =
        await fetch(
            `${FLUTTERWAVE_BASE_URL}/customers`,
            {

                method:
                    "POST",

                headers: {

                    "Authorization":
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json",

                    "X-Trace-Id":
                        generateTraceId(),

                    "X-Idempotency-Key":
                        generateIdempotencyKey()

                },

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        console.error(
            "FLUTTERWAVE CUSTOMER ERROR:",
            data
        );


        throw new Error(
            data?.message ||
            data?.error ||
            "Failed to create Flutterwave customer."
        );

    }


    const customerId =
        data?.data?.id;


    if (!customerId) {

        console.error(
            "FLUTTERWAVE CUSTOMER RESPONSE:",
            data
        );


        throw new Error(
            "Flutterwave customer ID was not returned."
        );

    }


    return {

        id:
            customerId,

        raw:
            data

    };

}


// =====================================================
// CREATE FLUTTERWAVE CHARGE
// =====================================================

async function createFlutterwaveCharge({

    accessToken,

    purchase,

    customerId,

    paymentMethodId

}) {

    if (!paymentMethodId) {

        throw new Error(
            "Flutterwave payment method ID is required."
        );

    }


    const amount =
        Number(
            purchase.amount
        );


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        throw new Error(
            "Invalid purchase amount."
        );

    }


    const currency =
        String(
            purchase.currency ||
            "NGN"
        ).toUpperCase();


    const reference =
        purchase.reference;


    if (!reference) {

        throw new Error(
            "Purchase reference is missing."
        );

    }


    const redirectUrl =
        process.env.FLW_REDIRECT_URL ||
        `${process.env.APP_URL}/coin-payment-success.html`;


    if (!redirectUrl) {

        throw new Error(
            "FLW_REDIRECT_URL or APP_URL is required."
        );

    }


    const payload = {

        reference,

        currency,

        customer_id:
            customerId,

        payment_method_id:
            paymentMethodId,

        redirect_url:
            redirectUrl,

        amount,

        meta: {

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


    const response =
        await fetch(
            `${FLUTTERWAVE_BASE_URL}/charges`,
            {

                method:
                    "POST",

                headers: {

                    "Authorization":
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json",

                    "X-Trace-Id":
                        generateTraceId(),

                    "X-Idempotency-Key":
                        generateIdempotencyKey()

                },

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        console.error(
            "FLUTTERWAVE CHARGE ERROR:",
            data
        );


        throw new Error(
            data?.message ||
            data?.error ||
            "Failed to create Flutterwave charge."
        );

    }


    const charge =
        data?.data;


    if (!charge) {

        console.error(
            "FLUTTERWAVE CHARGE RESPONSE:",
            data
        );


        throw new Error(
            "Flutterwave charge response is missing."
        );

    }


    let checkoutUrl =
        null;


    if (
        charge?.next_action?.type ===
        "redirect_url"
    ) {

        checkoutUrl =
            charge
                ?.next_action
                ?.redirect_url
                ?.url ||
            null;

    }


    return {

        chargeId:
            charge?.id ||
            null,

        checkoutUrl,

        status:
            charge?.status ||
            data?.status ||
            "pending",

        nextAction:
            charge?.next_action ||
            null,

        raw:
            data

    };

}


// =====================================================
// INITIALIZE PAYMENT
// =====================================================

async function initializePayment({

    purchase,

    user,

    paymentMethodId

}) {

    // =========================================
    // VALIDATION
    // =========================================

    if (!purchase) {

        throw new Error(
            "Purchase is required."
        );

    }


    if (!user) {

        throw new Error(
            "User is required."
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
        Number(purchase.amount) <= 0
    ) {

        throw new Error(
            "Invalid purchase amount."
        );

    }


    if (!user.email) {

        throw new Error(
            "User email is required for payment."
        );

    }


    // =========================================
    // PAYMENT METHOD
    // =========================================
    //
    // Ana iya samo shi daga:
    //
    // 1. Request
    // 2. Purchase record
    //
    // Ba za mu ƙirƙiri fake ID ba.
    // =========================================

    const finalPaymentMethodId =
        paymentMethodId ||
        purchase.flutterwavePaymentMethodId;


    if (!finalPaymentMethodId) {

        throw new Error(
            "Flutterwave payment method ID is required. Payment method must be created before initializing the charge."
        );

    }


    // =========================================
    // GET OAUTH TOKEN
    // =========================================

    const accessToken =
        await getFlutterwaveAccessToken();


    // =========================================
    // CREATE CUSTOMER
    // =========================================

    const customer =
        await createFlutterwaveCustomer({

            accessToken,

            user

        });


    // =========================================
    // CREATE CHARGE
    // =========================================

    const charge =
        await createFlutterwaveCharge({

            accessToken,

            purchase,

            customerId:
                customer.id,

            paymentMethodId:
                finalPaymentMethodId

        });


    // =========================================
    // RESPONSE
    // =========================================

    return {

        success:
            true,

        provider:
            "flutterwave",

        reference:
            purchase.reference,

        amount:
            Number(
                purchase.amount
            ),

        currency:
            purchase.currency ||
            "NGN",

        email:
            user.email,

        customerId:
            customer.id,

        paymentMethodId:
            finalPaymentMethodId,

        chargeId:
            charge.chargeId,

        checkoutUrl:
            charge.checkoutUrl,

        nextAction:
            charge.nextAction,

        status:
            charge.status

    };

}


// =====================================================
// TRACE ID
// =====================================================

function generateTraceId() {

    return (

        "2chat-" +

        Date.now()
            .toString(36) +

        "-" +

        Math.random()
            .toString(36)
            .substring(2, 15)

    );

}


// =====================================================
// IDEMPOTENCY KEY
// =====================================================

function generateIdempotencyKey() {

    return (

        "2chat-" +

        Date.now()
            .toString(36) +

        "-" +

        Math.random()
            .toString(36)
            .substring(2, 15)

    );

}


// =====================================================
// EXPORT
// =====================================================

module.exports =
    initializePayment;

async function createFlutterwavePaymentMethod({

accessToken,

customerId,

card

}) {

if (!accessToken) {

    throw new Error(
        "Flutterwave access token is required."
    );

}


if (!customerId) {

    throw new Error(
        "Flutterwave customer ID is required."
    );

}


if (!card) {

    throw new Error(
        "Card payment data is required."
    );

}


const requiredFields = [
    "encrypted_card_number",
    "encrypted_expiry_month",
    "encrypted_expiry_year",
    "encrypted_cvv",
    "nonce"
];


for (const field of requiredFields) {

    if (!card[field]) {

        throw new Error(
            `Missing encrypted card field: ${field}`
        );

    }

}


const response = await fetch(
    `${FLUTTERWAVE_BASE_URL}/payment-methods`,
    {

        method: "POST",

        headers: {

            "Authorization":
                `Bearer ${accessToken}`,

            "Content-Type":
                "application/json",

            "X-Trace-Id":
                generateTraceId(),

            "X-Idempotency-Key":
                generateIdempotencyKey()

        },

        body: JSON.stringify({

            type: "card",

            customer_id:
                customerId,

            card: {

                encrypted_card_number:
                    card.encrypted_card_number,

                encrypted_expiry_month:
                    card.encrypted_expiry_month,

                encrypted_expiry_year:
                    card.encrypted_expiry_year,

                encrypted_cvv:
                    card.encrypted_cvv,

                nonce:
                    card.nonce

            }

        })

    }
);


const data =
    await response.json();


if (!response.ok) {

    console.error(
        "FLUTTERWAVE PAYMENT METHOD ERROR:",
        data
    );


    throw new Error(
        data?.message ||
        data?.error?.message ||
        "Failed to create Flutterwave payment method."
    );

}


const paymentMethod =
    data?.data;


if (!paymentMethod?.id) {

    console.error(
        "FLUTTERWAVE PAYMENT METHOD RESPONSE:",
        data
    );


    throw new Error(
        "Flutterwave payment method ID was not returned."
    );

}


return {

    id:
        paymentMethod.id,

    type:
        paymentMethod.type,

    card:
        paymentMethod.card,

    raw:
        data

};

}


