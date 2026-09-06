// =====================================================
// 2CHAT
// COIN PAYMENT FRONTEND
// =====================================================
//
// IMPORTANT:
// - Frontend ba ya ƙara coins.
// - Backend + Flutterwave verification + webhook
//   ne kawai suke credit coins.
// - Wannan file yana sarrafa:
//      1. Payment initialization
//      2. Flutterwave redirect
//      3. Check Payment
//      4. Automatic payment status refresh
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
// GET PURCHASE
// =====================================================
//
// Wannan shi ne source of truth.
// Backend ne yake gaya mana payment status.
// =====================================================

async function getCoinPurchase(
    purchaseId
) {

    if (!purchaseId) {

        throw new Error(
            "Purchase ID is required."
        );

    }


    return await apiRequest(

        `/api/coin-purchases/${purchaseId}`,

        {
            method: "GET"
        }

    );
}


// =====================================================
// CHECK PAYMENT STATUS
// =====================================================
//
// Ba ya credit coins.
// Yana karanta status ne kawai daga backend.
// =====================================================

async function checkPaymentStatus(
    purchaseId,
    silent = false
) {

    try {

        if (!purchaseId) {

            throw new Error(
                "Purchase ID is required."
            );

        }


        if (!silent) {

            showPaymentMessage(
                "Checking payment..."
            );

        }


        const result =
            await getCoinPurchase(
                purchaseId
            );


        if (
            !result ||
            !result.success ||
            !result.purchase
        ) {

            throw new Error(

                result?.message ||
                "Unable to check payment status."

            );

        }


        const purchase =
            result.purchase;


        // =========================================
        // PAYMENT PAID
        // =========================================

        if (
            purchase.status === "paid" ||
            purchase.coinsCredited === true
        ) {

            showPaymentSuccess(
                "✅ Payment successful. Your coins have been credited."
            );


            stopPaymentPolling();


            return {

                paid: true,

                purchase

            };

        }


        // =========================================
        // PAYMENT FAILED
        // =========================================

        if (
            purchase.status === "failed"
        ) {

            showPaymentError(
                "❌ Payment failed. Please try again."
            );


            stopPaymentPolling();


            return {

                paid: false,

                failed: true,

                purchase

            };

        }


        // =========================================
        // PAYMENT CANCELLED
        // =========================================

        if (
            purchase.status === "cancelled"
        ) {

            showPaymentError(
                "❌ Payment was cancelled."
            );


            stopPaymentPolling();


            return {

                paid: false,

                cancelled: true,

                purchase

            };

        }


        // =========================================
        // PAYMENT STILL PENDING
        // =========================================

        if (!silent) {

            showPaymentMessage(
                "⏳ Payment is still being confirmed..."
            );

        }


        return {

            paid: false,

            pending: true,

            purchase

        };


    } catch (error) {

        console.error(
            "CHECK PAYMENT ERROR:",
            error
        );


        if (!silent) {

            showPaymentError(

                error.message ||
                "Unable to check payment status."

            );

        }


        throw error;

    }

}


// =====================================================
// PAYMENT POLLING
// =====================================================

let paymentPollingTimer = null;

let paymentPollingActive = false;


// =====================================================
// START PAYMENT POLLING
// =====================================================

function startPaymentPolling(
    purchaseId
) {

    if (!purchaseId) {

        console.error(
            "Cannot start payment polling without purchase ID."
        );

        return;

    }


    stopPaymentPolling();


    paymentPollingActive = true;


    // Check immediately.

    checkPaymentStatus(
        purchaseId,
        false
    )
    .catch(
        () => {}
    );


    // Then check every 5 seconds.

    paymentPollingTimer =
        setInterval(
            async () => {

                if (
                    !paymentPollingActive
                ) {

                    return;

                }


                try {

                    const result =
                        await checkPaymentStatus(
                            purchaseId,
                            true
                        );


                    if (
                        result.paid ||
                        result.failed ||
                        result.cancelled
                    ) {

                        stopPaymentPolling();

                    }

                } catch (error) {

                    console.error(
                        "PAYMENT POLLING ERROR:",
                        error
                    );

                }

            },

            5000

        );

}


// =====================================================
// STOP PAYMENT POLLING
// =====================================================

function stopPaymentPolling() {

    paymentPollingActive =
        false;


    if (
        paymentPollingTimer
    ) {

        clearInterval(
            paymentPollingTimer
        );

        paymentPollingTimer =
            null;

    }

}


// =====================================================
// CREATE PAYMENT METHOD
// =====================================================
//
// NOTE:
// Wannan function na wannan file yana aiki
// idan an riga an samu paymentMethodId.
//
// Raw card data ba ya shiga nan.
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


            // Start polling before leaving
            // the current page.

            startPaymentPolling(
                purchaseId
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


                startPaymentPolling(
                    purchaseId
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
// MANUAL CHECK PAYMENT
// =====================================================
//
// Ana iya haɗa wannan function da button:
//
// onclick="coinPayment.checkPayment('PURCHASE_ID')"
// =====================================================

async function checkPayment(
    purchaseId
) {

    try {

        showPaymentMessage(
            "🔄 Checking payment..."
        );


        const result =
            await checkPaymentStatus(
                purchaseId,
                false
            );


        if (
            result.paid
        ) {

            return result;

        }


        if (
            result.failed
        ) {

            return result;

        }


        showPaymentMessage(
            "⏳ Payment is not confirmed yet. Please wait a moment and check again."
        );


        return result;


    } catch (error) {

        console.error(
            "MANUAL CHECK PAYMENT ERROR:",
            error
        );


        showPaymentError(

            error.message ||
            "Unable to check payment."

        );


        throw error;

    }

}


// =====================================================
// RESUME PAYMENT CHECK
// =====================================================
//
// Wannan yana da amfani idan user ya dawo
// daga Flutterwave ko ya koma payment page.
// =====================================================

async function resumePaymentCheck(
    purchaseId
) {

    if (!purchaseId) {

        return;

    }


    try {

        const result =
            await checkPaymentStatus(
                purchaseId,
                false
            );


        if (
            result.paid ||
            result.failed ||
            result.cancelled
        ) {

            return result;

        }


        startPaymentPolling(
            purchaseId
        );


        return result;


    } catch (error) {

        console.error(
            "RESUME PAYMENT CHECK ERROR:",
            error
        );

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
// PAYMENT SUCCESS
// =====================================================

function showPaymentSuccess(
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
        "PAYMENT SUCCESS:",
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
// PAGE VISIBILITY
// =====================================================
//
// Idan user ya dawo daga Flutterwave,
// za mu sake duba payment.
// =====================================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            const purchaseId =
                new URLSearchParams(
                    window.location.search
                ).get(
                    "purchaseId"
                );


            if (purchaseId) {

                resumePaymentCheck(
                    purchaseId
                );

            }

        }

    }
);


// =====================================================
// BROWSER BACK / PAGE SHOW
// =====================================================

window.addEventListener(
    "pageshow",
    () => {

        const purchaseId =
            new URLSearchParams(
                window.location.search
            ).get(
                "purchaseId"
            );


        if (purchaseId) {

            resumePaymentCheck(
                purchaseId
            );

        }

    }
);


// =====================================================
// CLEANUP
// =====================================================

window.addEventListener(
    "beforeunload",
    () => {

        stopPaymentPolling();

    }
);


// =====================================================
// EXPORT FOR BROWSER
// =====================================================

window.coinPayment = {

    initializeCoinPayment,

    startCoinPayment,

    createPaymentMethod,

    checkPayment,

    checkPaymentStatus,

    startPaymentPolling,

    stopPaymentPolling,

    resumePaymentCheck

};
