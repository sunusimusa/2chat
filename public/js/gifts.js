const token =
    localStorage.getItem("token");


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
        type: "gift",
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
// RECEIVER ID
// =====================================

const params =
    new URLSearchParams(
        window.location.search
    );

const receiverId =
    params.get("receiverId");


// =====================================
// LOAD GIFTS
// =====================================

function loadGifts() {

    const grid =
        document.getElementById(
            "giftGrid"
        );

    grid.innerHTML = "";

    GIFTS.forEach(gift => {

        const card =
            document.createElement("div");

        card.className =
            "gift-card";

        card.innerHTML = `

            <div class="gift-icon">
                ${gift.icon}
            </div>

            <span class="gift-name">
                ${gift.name}
            </span>

            <span class="gift-price">
                🪙 ${gift.coins}
            </span>

        `;

        card.onclick = () => {

            selectGift(
                gift,
                card
            );

        };

        grid.appendChild(card);

    });

}


// =====================================
// SELECT GIFT
// =====================================

function selectGift(gift, card) {

    selectedGift = gift;

    document
        .querySelectorAll(".gift-card")
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });

    card.classList.add(
        "selected"
    );


    document.getElementById(
        "selectedBox"
    ).style.display = "flex";


    document.getElementById(
        "selectedIcon"
    ).innerText = gift.icon;


    document.getElementById(
        "selectedName"
    ).innerText = gift.name;


    document.getElementById(
        "selectedCoins"
    ).innerText = gift.coins;

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

            document.getElementById(
                "myCoins"
            ).innerText =
                data.wallet.coins || 0;

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

        return alert(
            "Please select a gift"
        );

    }


    if (!receiverId) {

        return alert(
            "Creator ID is missing"
        );

    }


    const coins =
        selectedGift.coins;


    const currentCoins =
        Number(
            document.getElementById(
                "myCoins"
            ).innerText
        );


    if (currentCoins < coins) {

        return alert(
            "❌ You don't have enough coins"
        );

    }


    const sendBtn =
        document.getElementById(
            "sendBtn"
        );

    sendBtn.disabled = true;

    sendBtn.innerText =
        "Sending...";


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
                            selectedGift.type,

                        coins:
                            selectedGift.coins

                    })

                }
            );


        const data =
            await res.json();


        if (data.success) {

            const giftBeingSent = selectedGift;

if (fromShort) {

    const giftData = {
        name: giftBeingSent.name,
        icon: giftBeingSent.icon,
        type: giftBeingSent.type,
        coins: giftBeingSent.coins
    };

    sessionStorage.setItem(
        "shortGiftConfirmation",
        JSON.stringify(giftData)
    );

    alert(
        "🎁 " +
        giftBeingSent.name +
        " sent successfully!"
    );

    window.location.href =
        "/shorts.html?video=" +
        encodeURIComponent(fromShort);

    return;
}

            alert(
                "🎁 " +
                selectedGift.name +
                " sent successfully!"
            );

            await loadWallet();

            selectedGift = null;

            document
                .querySelectorAll(
                    ".gift-card"
                )
                .forEach(card => {

                    card.classList.remove(
                        "selected"
                    );

                });

            document.getElementById(
                "selectedBox"
            ).style.display =
                "none";

        } else {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Gift failed"
                )
            );

        }

    } catch (err) {

        console.error(
            "SEND GIFT ERROR:",
            err
        );

        alert(
            "❌ Network error"
        );

    }


    sendBtn.disabled = false;

    sendBtn.innerText =
        "🎁 Send Gift";

}


// =====================================
// LOAD CREATOR
// =====================================

async function loadReceiver() {

    if (!receiverId) return;

    try {

        const res =
            await fetch(
                "/api/users/" +
                receiverId
            );

        const data =
            await res.json();

        if (
            data.success &&
            data.user
        ) {

            document.getElementById(
                "receiverName"
            ).innerText =
                "@" +
                data.user.username;

            document.getElementById(
                "receiverAvatar"
            ).src =
                data.user.avatar ||
                "/images/default.png";

        }

    } catch (err) {

        console.log(
            "Receiver loading skipped"
        );

    }

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

}
