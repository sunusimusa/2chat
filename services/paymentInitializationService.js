/**
 * =====================================================
 * 2CHAT
 * FLUTTERWAVE LIVE V4 PAYMENT INITIALIZATION SERVICE
 * =====================================================
 *
 * IMPORTANT:
 *
 * - Wannan service yana amfani da Flutterwave LIVE v4.
 * - Ba ya ƙara coins.
 * - Ba ya canza Wallet.
 * - Ba ya saka purchase zuwa "paid".
 * - Webhook + verification ne za su tabbatar da payment.
 * =====================================================
 */


// =====================================================
// ENVIRONMENT
// =====================================================

const FLUTTERWAVE_BASE_URL =
    process.env.FLW_BASE_URL ||
    "https://f4bexperience.flutterwave.com";


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
            data?.error ||
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

    if (!accessToken) {

        throw new Error(
            "Flutterwave access token is required."
        );

    }


    if (!user) {

        throw new Error(
            "User is required."
        );

    }


    const email =
        String(
            user.email ||
            ""
        )
        .trim();


    if (!email) {

        throw new Error(
            "User email is required."
        );

    }


    const username =
        String(
            user.username ||
            "2Chat User"
        )
        .trim();


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

        email

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
            data?.error?.message ||
            data?.error ||
            "Failed to create Flutterwave customer."
        );

    }


    const customer =
        data?.data;


    if (!customer?.id) {

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
            customer.id,

        raw:
            data

    };

}


// =====================================================
// CREATE FLUTTERWAVE PAYMENT METHOD
// =====================================================
//
// IMPORTANT:
//
// Kada mu adana raw card number/CVV.
// Card data dole ya kamata ya kasance encrypted
// values daga approved Flutterwave flow.
// =====================================================

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


    for (
        const field of requiredFields
    ) {

        if (!card[field]) {

            throw new Error(
                `Missing encrypted card field: ${field}`
            );

        }

    }


    const payload = {

        type:
            "card",

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

    };


    const response =
        await fetch(
            `${FLUTTERWAVE_BASE_URL}/payment-methods`,
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
            "FLUTTERWAVE PAYMENT METHOD ERROR:",
            data
        );


        throw new Error(
            data?.message ||
            data?.error?.message ||
            data?.error ||
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


// =====================================================
// CREATE PAYMENT METHOD
// =====================================================
//
// Wannan wrapper ne da controller zai kira.
// =====================================================

async function createPaymentMethod({

    user,

    card

}) {

    if (!user) {

        throw new Error(
            "User is required."
        );

    }


    if (!card) {

        throw new Error(
            "Card payment data is required."
        );

    }


    const accessToken =
        await getFlutterwaveAccessToken();


    const customer =
        await createFlutterwaveCustomer({

            accessToken,

            user

        });


    const paymentMethod =
        await createFlutterwavePaymentMethod({

            accessToken,

            customerId:
                customer.id,

            card

        });


    return {

        id:
            paymentMethod.id,

        type:
            paymentMethod.type,

        card:
            paymentMethod.card,

        customerId:
            customer.id,

        raw:
            paymentMethod.raw

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

    if (!accessToken) {

        throw new Error(
            "Flutterwave access token is required."
        );

    }


    if (!purchase) {

        throw new Error(
            "Purchase is required."
        );

    }


    if (!customerId) {

        throw new Error(
            "Flutterwave customer ID is required."
        );

    }


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
        )
        .toUpperCase();


    const reference =
        String(
            purchase.reference ||
            ""
        )
        .trim();


    if (!reference) {

        throw new Error(
            "Purchase reference is missing."
        );

    }


    const appUrl =
        String(
            process.env.APP_URL ||
            ""
        )
        .replace(
            /\/$/,
            ""
        );


    const redirectUrl =
        process.env.FLW_REDIRECT_URL ||
        (
            appUrl
                ? `${appUrl}/html/coin-payment-success.html`
                : null
        );


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
            data?.error?.message ||
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


    let paymentUrl =
        null;


    if (
        charge?.next_action?.type ===
        "redirect_url"
    ) {

        paymentUrl =
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

        paymentUrl,

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
        !Number.isFinite(
            Number(
                purchase.amount
            )
        ) ||
        Number(
            purchase.amount
        ) <= 0
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

    const finalPaymentMethodId =
        paymentMethodId ||
        purchase.flutterwavePaymentMethodId;


    if (!finalPaymentMethodId) {

        throw new Error(
            "Flutterwave payment method ID is required."
        );

    }


    // =========================================
    // GET TOKEN
    // =========================================

    const accessToken =
        await getFlutterwaveAccessToken();


    // =========================================
    // CUSTOMER
    // =========================================

    let customerId =
        purchase.flutterwaveCustomerId;


    if (!customerId) {

        const customer =
            await createFlutterwaveCustomer({

                accessToken,

                user

            });


        customerId =
            customer.id;

    }


    // =========================================
    // CHARGE
    // =========================================

    const charge =
        await createFlutterwaveCharge({

            accessToken,

            purchase,

            customerId,

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

        customerId,

        paymentMethodId:
            finalPaymentMethodId,

        chargeId:
            charge.chargeId,

        checkoutUrl:
            charge.paymentUrl,

        paymentUrl:
            charge.paymentUrl,

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
            .substring(
                2,
                15
            )

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
            .substring(
                2,
                15
            )

    );

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    initializePayment,

    createPaymentMethod,

    getFlutterwaveAccessToken,

    createFlutterwaveCustomer,

    createFlutterwavePaymentMethod,

    createFlutterwaveCharge

};

// =====================================================
// 2CHAT
// FLUTTERWAVE LIVE V4 PAYMENT VERIFICATION SERVICE
// =====================================================
//
// IMPORTANT:
//
// - Yana verify Flutterwave charge.
// - Ba ya ƙara coins kai tsaye.
// - Ba ya canza Wallet.
// - Yana dawo da verified transaction.
// =====================================================

const {
    getFlutterwaveAccessToken
} = require("./paymentInitializationService");


// =====================================================
// ENVIRONMENT
// =====================================================

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


    // =========================================
    // GET ACCESS TOKEN
    // =========================================

    const accessToken =
        await getFlutterwaveAccessToken();


    // =========================================
    // VERIFY CHARGE
    // =========================================

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
            charge.id,

        reference:
            charge.reference,

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

// =====================================================
// 2CHAT
// COIN PURCHASE CREDIT SERVICE
// =====================================================
//
// IMPORTANT:
//
// - Ana kira ne bayan an tabbatar da payment.
// - Ba ya dogara da webhook kawai.
// - Yana hana double credit.
// - Legacy user wallet babu shi => zai ƙirƙira.
// =====================================================

const mongoose =
    require("mongoose");

const CoinPurchase =
    require("../models/CoinPurchase");

const Wallet =
    require("../models/Wallet");


// =====================================================
// CREDIT PURCHASE COINS
// =====================================================

async function creditCoinPurchase(
    purchaseId,
    verifiedPayment
) {

    if (!purchaseId) {

        throw new Error(
            "Purchase ID is required."
        );

    }


    if (!verifiedPayment) {

        throw new Error(
            "Verified payment is required."
        );

    }


    // =========================================
    // TRANSACTION
    // =========================================

    const session =
        await mongoose.startSession();


    try {

        let result = null;


        await session.withTransaction(
            async () => {

                // =================================
                // FIND PURCHASE
                // =================================

                const purchase =
                    await CoinPurchase.findById(
                        purchaseId
                    )
                    .session(session);


                if (!purchase) {

                    throw new Error(
                        "Coin purchase order not found."
                    );

                }


                // =================================
                // ALREADY CREDITED
                // =================================

                if (
                    purchase.coinsCredited ===
                    true
                ) {

                    result = {

                        alreadyCredited:
                            true,

                        purchase,

                        wallet:
                            null

                    };

                    return;

                }


                // =================================
                // VERIFY PURCHASE REFERENCE
                // =================================

                if (
                    String(
                        verifiedPayment.reference
                    ) !==
                    String(
                        purchase.reference
                    )
                ) {

                    throw new Error(
                        "Payment reference does not match purchase."
                    );

                }


                // =================================
                // VERIFY AMOUNT
                // =================================

                const expectedAmount =
                    Number(
                        purchase.amount
                    );

                const paidAmount =
                    Number(
                        verifiedPayment.amount
                    );


                if (
                    !Number.isFinite(
                        paidAmount
                    ) ||
                    paidAmount !==
                    expectedAmount
                ) {

                    throw new Error(
                        "Payment amount does not match purchase amount."
                    );

                }


                // =================================
                // VERIFY CURRENCY
                // =================================

                const expectedCurrency =
                    String(
                        purchase.currency ||
                        "NGN"
                    ).toUpperCase();

                const paidCurrency =
                    String(
                        verifiedPayment.currency ||
                        ""
                    ).toUpperCase();


                if (
                    paidCurrency !==
                    expectedCurrency
                ) {

                    throw new Error(
                        "Payment currency does not match purchase currency."
                    );

                }


                // =================================
                // VERIFY STATUS
                // =================================

                if (
                    verifiedPayment.status !==
                    "succeeded"
                ) {

                    throw new Error(
                        `Payment is not successful. Current status: ${verifiedPayment.status}`
                    );

                }


                // =================================
                // GET USER WALLET
                // =================================

                let wallet =
                    await Wallet.findOne({
                        userId:
                            purchase.userId
                    })
                    .session(session);


                // =================================
                // LEGACY USER
                // CREATE WALLET
                // =================================

                if (!wallet) {

                    const created =
                        await Wallet.create(
                            [
                                {

                                    userId:
                                        purchase.userId,

                                    coins:
                                        0,

                                    balance:
                                        0

                                }
                            ],
                            {
                                session
                            }
                        );


                    wallet =
                        created[0];

                }


                // =================================
                // ADD COINS
                // =================================

                wallet.coins =
                    Number(
                        wallet.coins || 0
                    ) +
                    Number(
                        purchase.coins
                    );


                // =================================
                // ADD BALANCE
                // =================================
                //
                // 100 Coins = ₦100
                //
                // =================================

                wallet.balance =
                    Number(
                        wallet.balance || 0
                    ) +
                    Number(
                        purchase.amount
                    );


                await wallet.save({
                    session
                });


                // =================================
                // MARK PURCHASE VERIFIED
                // =================================

                purchase.status =
                    "paid";


                purchase.paymentVerifiedAt =
                    new Date();


                purchase.coinsCredited =
                    true;


                purchase.coinsCreditedAt =
                    new Date();


                // =================================
                // SAVE TRANSACTION ID
                // =================================

                if (
                    verifiedPayment.id
                ) {

                    purchase.flutterwaveChargeId =
                        String(
                            verifiedPayment.id
                        );

                }


                await purchase.save({
                    session
                });


                result = {

                    alreadyCredited:
                        false,

                    purchase,

                    wallet

                };

            }
        );


        return result;


    } finally {

        await session.endSession();

    }

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    creditCoinPurchase

};
