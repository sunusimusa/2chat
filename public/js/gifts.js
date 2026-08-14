const token =
    localStorage.getItem("token");


// =====================================
// URL PARAMETERS
// =====================================

const params =
    new URLSearchParams(
        window.location.search
    );

const receiverId =
    params.get("receiverId");

const fromShort =
    params.get("fromShort");


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
            "giftOptions"
        );

    if (!options) {
        console.error(
            "giftOptions element not found"
        );
        return;
    }

    options.innerHTML = "";


    GIFTS.forEach(gift => {

        const button =
            document.createElement("button");

        button.className =
            "gift-option";

        button.type =
            "button";

        button.dataset.gift =
            gift.type;

        button.dataset.coins =
            gift.coins;


        button.innerHTML = `

            <span class="gift-emoji">
                ${gift.icon}
            </span>

            <strong>
                ${gift.name}
            </strong>

            <small>
                ${gift.coins.toLocaleString()} coins
            </small>

        `;


        button.addEventListener(
            "click",
            () => {

                selectGift(
                    gift,
                    button
                );

            }
        );


        options.appendChild(
            button
        );

    });

}


// =====================================
// SELECT GIFT
// =====================================

function selectGift(
    gift,
    button
) {

    selectedGift =
        gift;


    document
        .querySelectorAll(
            ".gift-option"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    button.classList.add(
        "selected"
    );


    const selectedBox =
        document.getElementById(
            "selectedGift"
        );


    if (selectedBox) {

        selectedBox.innerHTML = `

            <span style="font-size:32px;">
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
        document.getElementById(
            "sendGiftBtn"
        );


    if (sendBtn) {

        sendBtn.disabled =
            false;

    }

}


// =====================================
// LOAD WALLET
// =====================================

async function loadWallet() {

    try {

        const res =
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
            await res.json();


        if (
            data.success &&
            data.wallet
        ) {

            const coins =
                Number(
                    data.wallet.coins || 0
                );


            const coinBalance =
                document.getElementById(
                    "coinBalance"
                );


            if (coinBalance) {

                coinBalance.innerText =
                    coins.toLocaleString();

            }

        }

    } catch (err) {

        console.error(
            "WALLET ERROR:",
            err
        );

    }

}


// =====================================
// SEND GIFT
// =====================================

async function sendSelectedGift() {

    if (!selectedGift) {

        return alert(
            "Please select a gift first."
        );

    }


    if (!receiverId) {

        return alert(
            "Creator ID is missing."
        );

    }


    const coinElement =
        document.getElementById(
            "coinBalance"
        );


    const currentCoins =
        Number(
            (coinElement?.innerText || "0")
                .replaceAll(",", "")
        );


    if (
        currentCoins <
        selectedGift.coins
    ) {

        return alert(
            "❌ You don't have enough coins."
        );

    }


    const sendBtn =
        document.getElementById(
            "sendGiftBtn"
        );


    if (sendBtn) {

        sendBtn.disabled =
            true;

        sendBtn.innerText =
            "Sending...";

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
         * Idan daga Shorts muka zo,
         * mu koma Short ɗin da aka fito.
         */

        if (fromShort) {

            window.location.href =
                "/shorts.html?video=" +
                encodeURIComponent(
                    fromShort
                );

            return;

        }


        /*
         * Idan daga wani wuri aka zo,
         * mu ci gaba da kasancewa a Gift page.
         */

        alert(
            "🎁 " +
            giftBeingSent.name +
            " sent successfully!"
        );


        await loadWallet();


        selectedGift =
            null;


        document
            .querySelectorAll(
                ".gift-option"
            )
            .forEach(card => {

                card.classList.remove(
                    "selected"
                );

            });


        const selectedBox =
            document.getElementById(
                "selectedGift"
            );


        if (selectedBox) {

            selectedBox.innerText =
                "Choose a gift first.";

        }


        if (sendBtn) {

            sendBtn.disabled =
                true;

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
                encodeURIComponent(
                    receiverId
                )
            );


        const data =
            await res.json();


        if (
            data.success &&
            data.user
        ) {

            const creatorName =
                document.getElementById(
                    "creatorName"
                );


            if (creatorName) {

                creatorName.innerText =
                    "@" +
                    data.user.username;

            }

        }

    } catch (err) {

        console.log(
            "Receiver loading skipped:",
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
            "sendGiftBtn"
        );


    if (!sendBtn) {

        console.error(
            "sendGiftBtn not found"
        );

        return;

    }


    sendBtn.addEventListener(
        "click",
        sendSelectedGift
    );


    sendBtn.disabled =
        true;

}


// =====================================
// START
// =====================================

if (!token) {

    location.href =
        "/login.html";

} else {

    loadGifts();

    loadWallet();

    loadReceiver();

    setupSendButton();

}
