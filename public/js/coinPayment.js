// =====================================================
// 2CHAT
// COIN PAYMENT FRONTEND
// =====================================================
//
// IMPORTANT:
// - Ba ya ƙara coins daga frontend.
// - Backend ne kawai zai tabbatar da payment.
// - Webhook + verification ne za su credit coins.
// =====================================================


// =====================================================
// CONFIG
// =====================================================

const API_BASE_URL = "";


// =====================================================
// GET TOKEN
// =====================================================

function getAuthToken() {

    const token =
        localStorage.getItem("token");

    if (!token) {

        throw new Error(
            "Please login first."
        );

    }

    return token;

}


// =====================================================
// API REQUEST HELPER
// =====================================================

async function apiRequest(
    url,
    options = {}
) {

    const token =
        getAuthToken();


    const headers = {

        ...(options.headers || {}),

        "Authorization":
            `Bearer ${token}`

    };


    const response =
        await fetch(
            API_BASE_URL + url,
            {
                ...options,
                headers
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch (err) {

        data = null;

    }


    if (!response.ok) {

        throw new Error(

            data?.message ||
            "Request failed."

        );

    }


    return data;

}


// =====================================================
// CREATE PAYMENT METHOD
// =====================================================
//
// Wannan endpoint yana aika payment method
// zuwa backend.
//
// PAYMENT METHOD ID ne ake amfani da shi,
// ba raw card data ba.
// =====================================================

async function createPaymentMethod(
    purchaseId,
    paymentMethodId
) {

    if (!purchaseId) {

        throw new Error(
            "Purchase ID is required."
        );

    }


    if (!paymentMethodId) {

        throw new Error(
            "Payment method ID is required."
        );

    }


    const data =
        await apiRequest(

            `/api/coin-purchases/${purchaseId}/initialize-payment`,

            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        paymentMethodId:
                            String(
                                paymentMethodId
                            )

                    })

            }

        );


    return data;

}


// =====================================================
// INITIALIZE COIN PAYMENT
// =====================================================

async function initializeCoinPayment(
    purchaseId,
    paymentMethodId
) {

    try {

        if (!purchaseId) {

            throw new Error(
                "Purchase ID is required."
            );

        }


        if (!paymentMethodId) {

            throw new Error(
                "Payment method ID is required."
            );

        }


        showPaymentMessage(
            "Initializing payment..."
        );


        const result =
            await createPaymentMethod(

                purchaseId,

                paymentMethodId

            );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(

                result?.message ||
                "Payment initialization failed."

            );

        }


        const payment =
            result.payment;


        if (!payment) {

            throw new Error(
                "Payment information was not returned."
            );

        }


        // =========================================
        // CHECKOUT URL
        // =========================================

        const checkoutUrl =
            payment.checkoutUrl ||
            payment.paymentUrl;


        if (checkoutUrl) {

            showPaymentMessage(
                "Opening Flutterwave..."
            );


            window.location.href =
                checkoutUrl;


            return result;

        }


        // =========================================
        // NEXT ACTION
        // =========================================

        if (
            payment.nextAction &&
            payment.nextAction.type ===
                "redirect_url"
        ) {

            const redirectUrl =
                payment
                    .nextAction
                    ?.redirect_url
                    ?.url;


            if (redirectUrl) {

                showPaymentMessage(
                    "Opening Flutterwave..."
                );


                window.location.href =
                    redirectUrl;


                return result;

            }

        }


        // =========================================
        // NO CHECKOUT URL
        // =========================================

        throw new Error(

            "Flutterwave did not return a checkout URL."

        );


    } catch (error) {

        console.error(
            "COIN PAYMENT ERROR:",
            error
        );


        showPaymentError(
            error.message ||
            "Unable to initialize payment."
        );


        throw error;

    }

}


// =====================================================
// START PAYMENT FROM PURCHASE
// =====================================================
//
// Wannan function za ka iya kira daga
// checkout page:
//
// startCoinPayment(
//     purchaseId,
//     paymentMethodId
// );
//
// =====================================================

async function startCoinPayment(
    purchaseId,
    paymentMethodId
) {

    const button =
        document.getElementById(
            "continuePaymentButton"
        );


    if (button) {

        button.disabled = true;

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Processing...
        `;

    }


    try {

        await initializeCoinPayment(

            purchaseId,

            paymentMethodId

        );


    } catch (error) {

        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-credit-card"></i>
                Continue to Payment
            `;

        }

    }

}


// =====================================================
// PAYMENT MESSAGE
// =====================================================

function showPaymentMessage(
    message
) {

    const element =
        document.getElementById(
            "paymentMessage"
        );


    if (element) {

        element.style.display =
            "block";

        element.innerText =
            message;

        return;

    }


    console.log(
        "PAYMENT:",
        message
    );

}


// =====================================================
// PAYMENT ERROR
// =====================================================

function showPaymentError(
    message
) {

    const element =
        document.getElementById(
            "paymentMessage"
        );


    if (element) {

        element.style.display =
            "block";

        element.innerText =
            "❌ " + message;

        return;

    }


    alert(
        "❌ " + message
    );

}


// =====================================================
// EXPORT FOR BROWSER
// =====================================================
//
// Ba mu amfani da module.exports saboda
// wannan file frontend ne.
// =====================================================

window.coinPayment = {

    initializeCoinPayment,

    startCoinPayment,

    createPaymentMethod

};
