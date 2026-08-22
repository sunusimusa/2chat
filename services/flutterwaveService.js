const crypto = require("crypto");


// =====================================================
// FLUTTERWAVE V4 CONFIG
// =====================================================

const FLW_BASE_URL =
    "https://f4bexperience.flutterwave.com";

const FLW_TOKEN_URL =
    "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";


// =====================================================
// ENV CHECK
// =====================================================

function getCredentials() {

    const clientId =
        process.env.FLW_CLIENT_ID;

    const clientSecret =
        process.env.FLW_CLIENT_SECRET;


    if (
        !clientId ||
        !clientSecret
    ) {

        throw new Error(
            "Flutterwave credentials are missing."
        );

    }


    return {
        clientId,
        clientSecret
    };

}


// =====================================================
// ACCESS TOKEN CACHE
// =====================================================

let cachedAccessToken = null;

let tokenExpiresAt = 0;


// =====================================================
// GET ACCESS TOKEN
// =====================================================

async function getAccessToken() {

    const now =
        Date.now();


    // -----------------------------------------------
    // Reuse token if still valid
    // -----------------------------------------------

    if (
        cachedAccessToken &&
        now <
            tokenExpiresAt -
            (60 * 1000)
    ) {

        return cachedAccessToken;

    }


    const {
        clientId,
        clientSecret
    } =
        getCredentials();


    // -----------------------------------------------
    // OAuth request
    // -----------------------------------------------

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
            FLW_TOKEN_URL,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/x-www-form-urlencoded"

                },

                body

            }
        );


    const data =
        await response.json();


    if (
        !response.ok ||
        !data.access_token
    ) {

        console.error(
            "FLUTTERWAVE TOKEN ERROR:",
            data
        );

        throw new Error(
            data.error_description ||
            data.message ||
            "Failed to obtain Flutterwave access token."
        );

    }


    cachedAccessToken =
        data.access_token;


    tokenExpiresAt =
        now +
        (
            Number(
                data.expires_in ||
                600
            ) *
            1000
        );


    return cachedAccessToken;

}


// =====================================================
// GENERATE TRACE ID
// =====================================================

function generateTraceId() {

    return crypto
        .randomUUID();

}


// =====================================================
// GENERATE IDEMPOTENCY KEY
// =====================================================

function generateIdempotencyKey() {

    return crypto
        .randomUUID();

}


// =====================================================
// FLUTTERWAVE REQUEST
// =====================================================

async function flutterwaveRequest(
    endpoint,
    options = {}
) {

    const token =
        await getAccessToken();


    const response =
        await fetch(
            `${FLW_BASE_URL}${endpoint}`,
            {

                method:
                    options.method ||
                    "GET",

                headers: {

                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json",

                    "X-Trace-Id":
                        generateTraceId(),

                    "X-Idempotency-Key":
                        options.idempotencyKey ||
                        generateIdempotencyKey(),

                    ...(options.headers || {})

                },

                body:
                    options.body
                        ? JSON.stringify(
                            options.body
                        )
                        : undefined

            }
        );


    const data =
        await response.json();


    if (
        !response.ok
    ) {

        console.error(
            "FLUTTERWAVE API ERROR:",
            {
                status:
                    response.status,

                data
            }
        );


        const error =
            new Error(
                data.message ||
                "Flutterwave API request failed."
            );


        error.status =
            response.status;

        error.data =
            data;


        throw error;

    }


    return data;

}


// =====================================================
// CREATE CUSTOMER
// =====================================================
// Za mu yi amfani da wannan idan muna buƙatar
// Flutterwave customer_id.
// =====================================================

async function createCustomer({
    email,
    firstName,
    middleName,
    lastName,
    phone
}) {

    if (!email) {

        throw new Error(
            "Customer email is required."
        );

    }


    const body = {

        email,

        name: {

            first:
                firstName ||
                "",

            middle:
                middleName ||
                "",

            last:
                lastName ||
                ""

        }

    };


    if (phone) {

        body.phone = {

            country_code:
                "234",

            number:
                String(phone)
                .replace(
                    /^\+?234/,
                    ""
                )
                .replace(
                    /^0/,
                    ""
                )

        };

    }


    return flutterwaveRequest(
        "/customers",
        {

            method:
                "POST",

            body

        }
    );

}


// =====================================================
// CREATE CHARGE
// =====================================================
// Wannan yana buƙatar customer_id da
// payment_method_id.
// =====================================================

async function createCharge({

    amount,

    currency = "NGN",

    reference,

    customerId,

    paymentMethodId,

    redirectUrl,

    meta = {}

}) {

    if (!amount) {

        throw new Error(
            "Payment amount is required."
        );

    }


    if (!reference) {

        throw new Error(
            "Payment reference is required."
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


    return flutterwaveRequest(
        "/charges",
        {

            method:
                "POST",

            body: {

                amount:
                    Number(amount),

                currency,

                reference,

                customer_id:
                    customerId,

                payment_method_id:
                    paymentMethodId,

                redirect_url:
                    redirectUrl,

                meta

            }

        }
    );

}


// =====================================================
// GET CHARGE
// =====================================================

async function getCharge(
    chargeId
) {

    if (!chargeId) {

        throw new Error(
            "Charge ID is required."
        );

    }


    return flutterwaveRequest(
        `/charges/${encodeURIComponent(
            chargeId
        )}`,
        {

            method:
                "GET"

        }
    );

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getAccessToken,

    flutterwaveRequest,

    createCustomer,

    createCharge,

    getCharge,

    generateTraceId,

    generateIdempotencyKey

};
