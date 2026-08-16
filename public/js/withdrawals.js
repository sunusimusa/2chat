// =========================================
// 2CHAT WITHDRAWALS
// =========================================


// =========================================
// FORMAT NAIRA
// =========================================

function formatNaira(amount) {

    return "₦" +
        Number(amount || 0)
            .toLocaleString(
                "en-NG",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(value) {

    if (!value) {

        return "Date unavailable";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleString(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =========================================
// STATUS CLASS
// =========================================

function getStatusClass(status) {

    return "status-" +
        String(status || "pending")
            .toLowerCase();

}


// =========================================
// LOAD WALLET BALANCE
// =========================================

async function loadWalletBalance() {

    const token =
        localStorage.getItem("token");


    if (!token) {

        return;

    }


    try {

        const response =
            await fetch(
                "/api/wallet",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        const data =
            await response.json();


        if (
            data.success &&
            data.wallet
        ) {

            document.getElementById(
                "availableBalance"
            ).innerText =
                formatNaira(
                    data.wallet.availableBalance
                );

        }

    } catch (error) {

        console.error(
            "LOAD WALLET BALANCE ERROR:",
            error
        );

    }

}


// =========================================
// LOAD WITHDRAWALS
// =========================================

async function loadWithdrawals() {

    const token =
        localStorage.getItem("token");


    const message =
        document.getElementById(
            "message"
        );


    const list =
        document.getElementById(
            "withdrawalList"
        );


    const refreshBtn =
        document.getElementById(
            "refreshBtn"
        );


    if (!token) {

        message.innerText =
            "❌ Please login first.";

        return;

    }


    refreshBtn.disabled =
        true;

    refreshBtn.innerText =
        "Loading...";


    message.innerText =
        "Loading withdrawal history...";


    list.innerHTML = "";


    try {

        const response =
            await fetch(
                "/api/withdrawals",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        const data =
            await response.json();


        console.log(
            "WITHDRAWALS:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load withdrawals"
            );

        }


        const withdrawals =
            Array.isArray(
                data.withdrawals
            )
                ? data.withdrawals
                : [];


        if (
            withdrawals.length === 0
        ) {

            list.innerHTML = `

                <div class="empty">

                    💸 No withdrawal requests yet.

                </div>

            `;

            message.innerText =
                "No withdrawals found.";

            await loadWalletBalance();

            return;

        }


        list.innerHTML =
            withdrawals
                .map(
                    withdrawal =>
                        renderWithdrawal(
                            withdrawal
                        )
                )
                .join("");


        message.innerText =
            "✅ Withdrawal history loaded";


        await loadWalletBalance();


    } catch (error) {

        console.error(
            "LOAD WITHDRAWALS ERROR:",
            error
        );


        message.innerText =
            "❌ " +
            error.message;


        list.innerHTML = `

            <div class="empty">

                ❌ Unable to load withdrawals.

                <br><br>

                ${escapeHTML(
                    error.message
                )}

            </div>

        `;

    } finally {

        refreshBtn.disabled =
            false;

        refreshBtn.innerText =
            "🔄 Refresh";

    }

}


// =========================================
// RENDER WITHDRAWAL
// =========================================

function renderWithdrawal(withdrawal) {

    const id =
        escapeHTML(
            withdrawal._id
        );


    const amount =
        Number(
            withdrawal.amount || 0
        );


    const lockedAmount =
        Number(
            withdrawal.lockedAmount ??
            amount
        );


    const status =
        String(
            withdrawal.status ||
            "pending"
        );


    const statusClass =
        getStatusClass(
            status
        );


    const createdAt =
        formatDate(
            withdrawal.createdAt
        );


    const reference =
        withdrawal.payoutReference ||
        "Not available";


    const provider =
        withdrawal.paymentProvider ||
        "Not available";


    return `

        <article
            class="withdrawal-card">


            <div
                class="withdrawal-top">


                <div>

                    <div
                        class="withdrawal-amount">

                        ${formatNaira(amount)}

                    </div>


                    <div
                        class="withdrawal-date">

                        ${escapeHTML(
                            createdAt
                        )}

                    </div>

                </div>


                <span
                    class="status ${statusClass}">

                    ${escapeHTML(
                        status
                    )}

                </span>


            </div>


            <div
                class="withdrawal-info">


                <div class="info-row">

                    <span>
                        Locked amount
                    </span>

                    <span>
                        ${formatNaira(
                            lockedAmount
                        )}
                    </span>

                </div>


                <div class="info-row">

                    <span>
                        Payment provider
                    </span>

                    <span>
                        ${escapeHTML(
                            provider
                        )}
                    </span>

                </div>


                <div class="info-row">

                    <span>
                        Reference
                    </span>

                    <span>
                        ${escapeHTML(
                            reference
                        )}
                    </span>

                </div>


            </div>


            <div
                class="card-actions">


                <button
                    class="card-btn details-btn"
                    onclick="viewWithdrawal('${id}')">

                    👁 View Details

                </button>


                ${
                    status === "pending"
                        ? `

                            <button
                                class="card-btn cancel-btn"
                                onclick="cancelWithdrawal('${id}')">

                                ✕ Cancel

                            </button>

                        `
                        : ""
                }


            </div>


        </article>

    `;

}


// =========================================
// VIEW SINGLE WITHDRAWAL
// =========================================

async function viewWithdrawal(id) {

    const token =
        localStorage.getItem("token");


    if (!token) {

        alert(
            "❌ Please login first."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/withdrawals/" +
                encodeURIComponent(id),
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load withdrawal"
            );

        }


        showWithdrawalDetails(
            data.withdrawal
        );


    } catch (error) {

        console.error(
            "VIEW WITHDRAWAL ERROR:",
            error
        );


        alert(
            "❌ " +
            error.message
        );

    }

}


// =========================================
// SHOW DETAILS
// =========================================

function showWithdrawalDetails(
    withdrawal
) {

    const details =
        document.getElementById(
            "withdrawalDetails"
        );


    const status =
        String(
            withdrawal.status ||
            "pending"
        );


    details.innerHTML = `

        <div class="withdrawal-info">

            <div class="info-row">

                <span>
                    Amount
                </span>

                <span>
                    ${formatNaira(
                        withdrawal.amount
                    )}
                </span>

            </div>


            <div class="info-row">

                <span>
                    Status
                </span>

                <span>
                    ${escapeHTML(
                        status
                    )}
                </span>

            </div>


            <div class="info-row">

                <span>
                    Locked amount
                </span>

                <span>
                    ${formatNaira(
                        withdrawal.lockedAmount
                    )}
                </span>

            </div>


            <div class="info-row">

                <span>
                    Payment provider
                </span>

                <span>
                    ${escapeHTML(
                        withdrawal.paymentProvider ||
                        "Not available"
                    )}
                </span>

            </div>


            <div class="info-row">

                <span>
                    Reference
                </span>

                <span>
                    ${escapeHTML(
                        withdrawal.payoutReference ||
                        "Not available"
                    )}
                </span>

            </div>


            <div class="info-row">

                <span>
                    Created
                </span>

                <span>
                    ${escapeHTML(
                        formatDate(
                            withdrawal.createdAt
                        )
                    )}
                </span>

            </div>


            ${
                withdrawal.processingStartedAt
                    ? `

                        <div class="info-row">

                            <span>
                                Processing started
                            </span>

                            <span>
                                ${escapeHTML(
                                    formatDate(
                                        withdrawal.processingStartedAt
                                    )
                                )}
                            </span>

                        </div>

                    `
                    : ""
            }


            ${
                withdrawal.completedAt
                    ? `

                        <div class="info-row">

                            <span>
                                Completed
                            </span>

                            <span>
                                ${escapeHTML(
                                    formatDate(
                                        withdrawal.completedAt
                                    )
                                )}
                            </span>

                        </div>

                    `
                    : ""
            }


            ${
                withdrawal.cancelledAt
                    ? `

                        <div class="info-row">

                            <span>
                                Cancelled
                            </span>

                            <span>
                                ${escapeHTML(
                                    formatDate(
                                        withdrawal.cancelledAt
                                    )
                                )}
                            </span>

                        </div>

                    `
                    : ""
            }


            ${
                withdrawal.failedAt
                    ? `

                        <div class="info-row">

                            <span>
                                Failed
                            </span>

                            <span>
                                ${escapeHTML(
                                    formatDate(
                                        withdrawal.failedAt
                                    )
                                )}
                            </span>

                        </div>

                    `
                    : ""
            }


            ${
                withdrawal.failureReason
                    ? `

                        <div class="info-row">

                            <span>
                                Reason
                            </span>

                            <span>
                                ${escapeHTML(
                                    withdrawal.failureReason
                                )}
                            </span>

                        </div>

                    `
                    : ""
            }

        </div>

    `;


    document.getElementById(
        "detailsModal"
    ).classList.add(
        "show"
    );

}


// =========================================
// CLOSE DETAILS
// =========================================

function closeDetails() {

    document.getElementById(
        "detailsModal"
    ).classList.remove(
        "show"
    );

}


// =========================================
// CANCEL WITHDRAWAL
// =========================================

async function cancelWithdrawal(id) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this pending withdrawal?"
        );


    if (!confirmed) {

        return;

    }


    const token =
        localStorage.getItem("token");


    if (!token) {

        alert(
            "❌ Please login first."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/withdrawals/" +
                encodeURIComponent(id) +
                "/cancel",
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            "Bearer " + token,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to cancel withdrawal"
            );

        }


        alert(
            "✅ Withdrawal cancelled successfully."
        );


        await loadWithdrawals();


    } catch (error) {

        console.error(
            "CANCEL WITHDRAWAL ERROR:",
            error
        );


        alert(
            "❌ " +
            error.message
        );

    }

}


// =========================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// =========================================

document.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById(
                "detailsModal"
            );


        if (
            event.target === modal
        ) {

            closeDetails();

        }

    }
);

// =========================================
// CREATE WITHDRAWAL
// =========================================

async function createWithdrawal(event) {

    event.preventDefault();


    const token =
        localStorage.getItem("token");


    if (!token) {

        alert("❌ Login session expired");

        location.href =
            "/login.html";

        return;

    }


    const form =
        document.getElementById(
            "withdrawalForm"
        );


    const button =
        document.getElementById(
            "withdrawBtn"
        );


    const message =
        document.getElementById(
            "withdrawMessage"
        );


    const amount =
        document.getElementById(
            "amount"
        ).value;


    const bankName =
        document.getElementById(
            "bankName"
        ).value.trim();


    const accountName =
        document.getElementById(
            "accountName"
        ).value.trim();


    const accountNumber =
        document.getElementById(
            "accountNumber"
        ).value.trim();


    button.disabled =
        true;


    button.innerText =
        "Submitting...";


    message.innerText =
        "Processing withdrawal request...";


    try {

        const response =
            await fetch(
                "/api/withdrawals",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token

                    },

                    body:
                        JSON.stringify({

                            amount:
                                Number(amount),

                            bankName:
                                bankName,

                            accountName:
                                accountName,

                            accountNumber:
                                accountNumber

                        })

                }
            );


        const data =
            await response.json();


        console.log(
            "CREATE WITHDRAWAL:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Withdrawal request failed"
            );

        }


        message.innerText =
            "✅ Withdrawal request submitted successfully";


        form.reset();


        // Update displayed balance
        if (
            data.wallet
        ) {

            const balanceElement =
                document.getElementById(
                    "availableBalance"
                );


            if (
                balanceElement
            ) {

                balanceElement.innerText =
                    "₦" +
                    Number(
                        data.wallet.availableBalance || 0
                    ).toLocaleString(
                        "en-NG",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    );

            }

        }


        // Reload withdrawal history
        if (
            typeof loadWithdrawals ===
            "function"
        ) {

            loadWithdrawals();

        }


    } catch (error) {

        console.error(
            "WITHDRAWAL ERROR:",
            error
        );


        message.innerText =
            "❌ " +
            error.message;


    } finally {

        button.disabled =
            false;

        button.innerText =
            "💸 Request Withdrawal";

    }

}


// =========================================
// FORM EVENT
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const form =
            document.getElementById(
                "withdrawalForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                createWithdrawal
            );

        }

    }
);


// =========================================
// AUTO LOAD
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadWithdrawals();

    }
);
