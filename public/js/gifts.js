const token = localStorage.getItem("token");

// =====================================
// URL PARAMETERS
// =====================================

const params = new URLSearchParams(window.location.search);

const receiverId = params.get("receiverId");
const fromShort = params.get("fromShort");


// =====================================
// GIFTS CATALOG
// =====================================

const GIFTS = [

    {
        type: "rose",
        name: "Rose",
        icon: "🌹",
        coins: 10
    },

    {
        type: "gift-box",
        name: "Gift Box",
        icon: "🎁",
        coins: 50
    },

    {
        type: "heart",
        name: "Heart",
        icon: "💖",
        coins: 100
    },

    {
        type: "diamond",
        name: "Diamond",
        icon: "💎",
        coins: 200
    },

    {
        type: "crown",
        name: "Crown",
        icon: "👑",
        coins: 500
    },

    {
        type: "rocket",
        name: "Rocket",
        icon: "🚀",
        coins: 1000
    },

    {
        type: "fire",
        name: "Fire",
        icon: "🔥",
        coins: 1500
    },

    {
        type: "lion",
        name: "Lion",
        icon: "🦁",
        coins: 2000
    },

    {
        type: "trophy",
        name: "Trophy",
        icon: "🏆",
        coins: 3000
    },

    {
        type: "star",
        name: "Star",
        icon: "🌟",
        coins: 5000
    },

    {
        type: "money",
        name: "Money Bag",
        icon: "💰",
        coins: 10000
    },

    {
        type: "royal",
        name: "Royal Diamond",
        icon: "👑💎",
        coins: 20000
    }

];


let selectedGift = null;


// =====================================
// LOAD GIFTS
// =====================================

function loadGifts() {

    const options =
        document.getElementById(
            "giftGrid"
        );

    if (!options) {

        console.error(
            "❌ #giftGrid not found in gifts.html"
        );

        return;
    }

    options.innerHTML = "";


    GIFTS.forEach(gift => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className = "gift-option";

        button.dataset.gift = gift.type;

        button.dataset.coins = gift.coins;


        button.innerHTML = `

            <span class="gift-emoji">
                ${gift.icon}
            </span>

            <strong>
                ${gift.name}
            </strong>

            <small>
                🪙 ${gift.coins.toLocaleString()} coins
            </small>

        `;


        button.addEventListener(
            "click",
            function () {

                selectGift(
                    gift,
                    button
                );

            }
        );


        options.appendChild(button);

    });

}


// =====================================
// SELECT GIFT
// =====================================

function selectGift(gift, button) {

    selectedGift = gift;


    document
        .querySelectorAll(".gift-option")
        .forEach(card => {

            card.classList.remove("selected");

        });


    button.classList.add("selected");


    const selectedBox =
        document.getElementById("selectedBox")

    if (selectedBox) {

        selectedBox.innerHTML = `

            <span class="selected-gift-icon">
                ${gift.icon}
            </span>

            <strong>
                ${gift.name}
            </strong>

            <span>
                🪙 ${gift.coins.toLocaleString()} coins
            </span>

        `;

    }


    const sendBtn =
        document.getElementById("sendBtn")

    if (sendBtn) {

        sendBtn.disabled = false;

    }

}


// =====================================
// LOAD WALLET
// =====================================

async function loadWallet() {

    try {

        const res =
            await fetch("/api/wallet", {

                method: "GET",

                headers: {

                    "Authorization":
                        "Bearer " + token

                }

            });


        const data =
            await res.json();


        if (
            data.success &&
            data.wallet
        ) {

            const coins =
                Number(data.wallet.coins || 0);


            const coinBalance =
                document.getElementById("myCoins")


            if (coinBalance) {

                coinBalance.innerText =
                    coins.toLocaleString();

            }

        }

    } catch (err) {

        console.error(
            "Wallet error:",
            err
        );

    }

}


// =====================================
// SEND GIFT
// =====================================

async function sendSelectedGift() {

    if (!selectedGift) {

        alert("🎁 Please select a gift first.");

        return;

    }


    if (!receiverId) {

        alert("❌ Creator ID is missing.");

        return;

    }


    const coinElement =
    document.getElementById("myCoins");

    const currentCoins =
        Number(
            (coinElement?.innerText || "0")
            .replaceAll(",", "")
        );


    if (currentCoins < selectedGift.coins) {

        alert(
            "❌ You don't have enough coins."
        );

        return;

    }


    const sendBtn =
        document.getElementById("sendBtn");

    if (sendBtn) {

        sendBtn.disabled = true;

        sendBtn.innerText = "Sending...";

    }


    const giftBeingSent =
        selectedGift;


    try {

        const res =
            await fetch(
                "/api/gifts/send",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token

                    },

                    body: JSON.stringify({

                        receiverId:
                            receiverId,

                        giftType:
                            giftBeingSent.type,

                        coins:
                            giftBeingSent.coins

                    })

                }
            );


        const data =
            await res.json();


        console.log(
            "SEND GIFT RESPONSE:",
            data
        );


        if (!data.success) {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Gift failed"
                )
            );

            return;

        }


        // =================================
        // SUCCESS
        // =================================

        /*
         * IMPORTANT:
         * Idan daga Short aka zo,
         * sai SUCCESS → OK → koma Short.
         */

        if (fromShort) {

            alert(
                "🎁 " +
                giftBeingSent.name +
                " sent successfully!"
            );


            // Bayan an danna OK
            window.location.href =
                "/shorts.html?video=" +
                encodeURIComponent(fromShort);


            return;

        }


        // =================================
        // NORMAL GIFT PAGE
        // =================================

        alert(
            "🎁 " +
            giftBeingSent.name +
            " sent successfully!"
        );


        await loadWallet();


        selectedGift = null;


        document
            .querySelectorAll(".gift-option")
            .forEach(card => {

                card.classList.remove(
                    "selected"
                );

            });


        const selectedBox =
    document.getElementById(
        "selectedBox"
    );


        if (selectedBox) {

            selectedBox.innerText =
                "Choose a gift first.";

        }


    } catch (err) {

        console.error(
            "SEND GIFT ERROR:",
            err
        );


        alert(
            "❌ Network error. Please try again."
        );

    } finally {

        if (sendBtn) {

            sendBtn.disabled =
                selectedGift === null;

            sendBtn.innerText =
                "🎁 Send Gift";

        }

    }

}


// =====================================
// LOAD CREATOR
// =====================================

async function loadReceiver() {

    if (!receiverId) {

        const message =
            document.getElementById(
                "giftMessage"
            );

        if (message) {

            message.innerText =
                "❌ Creator ID is missing.";

        }

        return;

    }


    try {

        const res =
            await fetch(
                "/api/users/" +
                encodeURIComponent(receiverId)
            );


        const data =
            await res.json();


        if (
            data.success &&
            data.user
        ) {

            const creatorName =
                document.getElementById("receiverName")


            if (creatorName) {

                creatorName.innerText =
                    "@" +
                    data.user.username;

            }


            const avatar =
                const avatar =
    document.getElementById("receiverAvatar");

            if (avatar) {

                avatar.src =
                    data.user.avatar ||
                    "/images/default.png";

            }

        }

    } catch (err) {

        console.log(
            "Receiver loading error:",
            err
        );

    }

}


// =====================================
// SEND BUTTON
// =====================================

function setupSendButton() {

    const sendBtn =
        document.getElementById(
            "sendBtn"
        );

    if (!sendBtn) {

        console.error(
            "❌ sendBtn not found"
        );

        return;
    }

    sendBtn.disabled = true;

    sendBtn.addEventListener(
        "click",
        sendSelectedGift
    );
}


// =====================================
// START
// =====================================

if (!token) {

    window.location.href =
        "/login.html";

} else {

    loadGifts();

    loadWallet();

    loadReceiver();

    setupSendButton();

}
