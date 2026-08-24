/**
 * =====================================================
 * 2CHAT
 * FLUTTERWAVE LIVE V4 PAYMENT INITIALIZATION SERVICE
 * =====================================================
 */

const FLUTTERWAVE_BASE_URL =
    process.env.FLW_BASE_URL ||
    "https://f4bexperience.flutterwave.com";

const FLUTTERWAVE_TOKEN_URL =
    "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";


// =====================================================
// ACCESS TOKEN
// =====================================================

let cachedAccessToken = null;
let tokenExpiresAt = 0;

async function getFlutterwaveAccessToken() {

    const now = Date.now();

    if (
        cachedAccessToken &&
        now < tokenExpiresAt - 60000
    ) {
        return cachedAccessToken;
    }

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
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "client_credentials"
        });

    const response =
        await fetch(
            FLUTTERWAVE_TOKEN_URL,
            {
                method: "POST",

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

    cachedAccessToken =
        data.access_token;

    tokenExpiresAt =
        now +
        (
            Number(
                data.expires_in || 600
            ) * 1000
        );

    return cachedAccessToken;
}


// =====================================================
// TRACE ID
// =====================================================

function generateTraceId() {

    return (
        "2chat-" +
        Date.now().toString(36) +
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
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 15)
    );
}


// =====================================================
// CREATE CUSTOMER
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
            user.email || ""
        ).trim();

    if (!email) {
        throw new Error(
            "User email is required."
        );
    }

    const username =
        String(
            user.username ||
            "2Chat User"
        ).trim();

    const parts =
        username
            .split(/\s+/)
            .filter(Boolean);

    const firstName =
        parts[0] || "2Chat";

    const lastName =
        parts.slice(1).join(" ") ||
        "User";

    const payload = {

        name: {
            first: firstName,
            last: lastName
        },

        email
    };

    const response =
        await fetch(
            `${FLUTTERWAVE_BASE_URL}/customers`,
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

                body:
                    JSON.stringify(payload)
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

        throw new Error(
            "Flutterwave customer ID was not returned."
        );
    }

    return {
        id: customer.id,
        raw: data
    };
}


// =====================================================
// CREATE PAYMENT METHOD
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

    for (const field of requiredFields) {

        if (!card[field]) {

            throw new Error(
                `Missing encrypted card field: ${field}`
            );
        }
    }

    const payload = {

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
    };

    const response =
        await fetch(
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

                body:
                    JSON.stringify(payload)
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
// CREATE PAYMENT METHOD WRAPPER
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
// CREATE CHARGE
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
        Number(purchase.amount);

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
        String(
            purchase.reference ||
            ""
        ).trim();

    if (!reference) {
        throw new Error(
            "Purchase reference is missing."
        );
    }

    const appUrl =
        String(
            process.env.APP_URL ||
            ""
        ).replace(/\/$/, "");

    const redirectUrl =
        process.env.FLW_REDIRECT_URL ||
        (
            appUrl
                ? `${appUrl}/coinPayment.html`
                : null
        );

    if (!redirectUrl) {
        throw new Error(
            "FLW_REDIRECT_URL or APP_URL is required."
        );
    }

    const payload = {

        reference,

        amount,

        currency,

        customer_id:
            customerId,

        payment_method_id:
            paymentMethodId,

        redirect_url:
            redirectUrl,

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

                body:
                    JSON.stringify(payload)
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
        throw new Error(
            "Flutterwave charge response is missing."
        );
    }

    let paymentUrl = null;

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
            charge?.id || null,

        paymentUrl,

        status:
            String(
                charge?.status ||
                data?.status ||
                "pending"
            ).toLowerCase(),

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

    const amount =
        Number(purchase.amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
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

    const finalPaymentMethodId =
        paymentMethodId ||
        purchase.flutterwavePaymentMethodId;

    if (!finalPaymentMethodId) {

        throw new Error(
            "Flutterwave payment method ID is required. Create the payment method first."
        );
    }

    const accessToken =
        await getFlutterwaveAccessToken();

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

    const charge =
        await createFlutterwaveCharge({

            accessToken,

            purchase,

            customerId,

            paymentMethodId:
                finalPaymentMethodId
        });

    return {

        success: true,

        provider:
            "flutterwave",

        reference:
            purchase.reference,

        amount,

        currency:
            String(
                purchase.currency ||
                "NGN"
            ).toUpperCase(),

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
