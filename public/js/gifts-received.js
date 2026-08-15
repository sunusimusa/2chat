// =========================================
// GIFTS RECEIVED PAGE
// =========================================

function formatCoins(amount) {

    return Number(amount || 0).toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 0
        }
    );

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =========================================
// GET GIFT ICON
// =========================================

function getGiftIcon(gift) {

    return (
        gift.icon ||
        gift.emoji ||
        gift.giftIcon ||
        "🎁"
    );

}


// =========================================
// GET GIFT NAME
// =========================================

function getGiftName(gift) {

    return (
        gift.giftName ||
        gift.name ||
        gift.title ||
        gift.giftType ||
        "Gift"
    );

}


// =========================================
// GET SENDER NAME
// =========================================

function getSenderName(gift) {

    const sender =
        gift.senderId;


    if (
        sender &&
        typeof sender === "object"
    ) {

        return (
            sender.name ||
            sender.username ||
            "Unknown"
        );

    }


    return (
        gift.senderName ||
        "Unknown"
    );

}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(dateValue) {

    if (!dateValue) {

        return "Date unavailable";

    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateValue
        );

    }


    return date.toLocaleString(
        "en-GB",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =========================================
// RENDER GIFTS
// =========================================

function renderGifts(gifts) {

    const list =
        document.getElementById(
            "giftList"
        );


    if (
        !Array.isArray(gifts) ||
        gifts.length === 0
    ) {

        list.innerHTML = `

            <div class="empty">

                🎁 No gifts received yet.

            </div>

        `;

        return;

    }


    list.innerHTML =
        gifts.map(
            gift => {

                const icon =
                    escapeHtml(
                        getGiftIcon(gift)
                    );


                const name =
                    escapeHtml(
                        getGiftName(gift)
                    );


                const sender =
                    escapeHtml(
                        getSenderName(gift)
                    );


                const coins =
                    Number(
                        gift.coins || 0
                    );


                const creatorEarning =
                    Number(
                        gift.creatorEarning || 0
                    );


                const date =
                    formatDate(
                        gift.createdAt
                    );


                return `

                    <article
                        class="gift-card">


                        <div
                            class="gift-top">


                            <div
                                class="gift-name">

                                ${icon}
                                ${name}

                            </div>


                            <div
                                class="gift-price">

                                ${formatCoins(coins)}
                                coins

                            </div>


                        </div>



                        <div
                            class="gift-row">

                            👤 From:

                            <strong>
                                ${sender}
                            </strong>

                        </div>



                        <div
                            class="gift-row">

                            🪙 Gift value:

                            <strong>
                                ${formatCoins(coins)}
                                coins
                            </strong>

                        </div>



                        <div
                            class="gift-row">

                            💰 Creator earning:

                            <span
                                class="earning">

                                ${formatCoins(
                                    creatorEarning
                                )}
                                coins

                            </span>

                        </div>



                        <div
                            class="gift-row date">

                            📅 ${escapeHtml(date)}

                        </div>


                    </article>

                `;

            }
        ).join("");

}


// =========================================
// LOAD RECEIVED GIFTS
// =========================================

async function loadReceivedGifts() {

    const token =
        localStorage.getItem(
            "token"
        );


    const status =
        document.getElementById(
            "status"
        );


    const refreshBtn =
        document.getElementById(
            "refreshBtn"
        );


    const giftList =
        document.getElementById(
            "giftList"
        );


    // =====================================
    // CHECK LOGIN
    // =====================================

    if (!token) {

        status.innerText =
            "❌ Please login first.";

        return;

    }


    refreshBtn.disabled =
        true;

    refreshBtn.innerText =
        "Loading...";


    status.innerText =
        "Loading received gifts...";


    try {


        // =================================
        // GET RECEIVED GIFTS
        // =================================

        const response =
            await fetch(
                "/api/gifts/received",
                {

                    method: "GET",

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


        console.log(
            "RECEIVED GIFTS API:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load received gifts"
            );

        }


        // =================================
        // GIFTS
        // =================================

        const gifts =
            Array.isArray(
                data.gifts
            )
                ? data.gifts
                : [];


        // =================================
        // IMPORTANT
        //
        // TOTAL EARNED COMES FROM WALLET
        //
        // NOT FROM SUMMING OLD GIFTS
        // =================================

        const totalEarned =
            Number(
                data.totalEarned || 0
            );


        document.getElementById(
            "totalEarned"
        ).innerText =
            formatCoins(
                totalEarned
            );


        // =================================
        // GIFTS RECEIVED
        // =================================

        const giftsReceived =
            Number(
                data.giftsReceived ??
                gifts.length
            );


        document.getElementById(
            "giftsReceived"
        ).innerText =
            formatCoins(
                giftsReceived
            );


        // =================================
        // RENDER HISTORY
        // =================================

        renderGifts(
            gifts
        );


        status.innerText =
            "✅ Gifts loaded successfully";


    } catch (error) {

        console.error(
            "GIFTS RECEIVED ERROR:",
            error
        );


        status.innerText =
            "❌ " +
            error.message;


        giftList.innerHTML = `

            <div class="empty">

                ❌ Unable to load gifts.

                <br><br>

                ${escapeHtml(
                    error.message
                )}

            </div>

        `;

    }


    refreshBtn.disabled =
        false;

    refreshBtn.innerText =
        "🔄 Refresh Gifts";

}


// =========================================
// AUTO LOAD
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    loadReceivedGifts
);
