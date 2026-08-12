/* =========================
   CREATOR GIFTS
========================= */

async function loadCreatorGifts() {

    const token =
        localStorage.getItem("token");


    /* =========================
       LOGIN CHECK
    ========================= */

    if (!token) {

        location.href =
            "/login.html";

        return;

    }


    const message =
        document.getElementById(
            "giftMessage"
        );

    const giftList =
        document.getElementById(
            "giftList"
        );

    try {

        message.innerText =
            "Loading gifts...";


        const res =
            await fetch(
                "/api/gifts/received",
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


        console.log(
            "CREATOR GIFTS:",
            data
        );


        if (!res.ok || !data.success) {

            message.innerText =
                "❌ " +
                (
                    data.message ||
                    "Failed to load gifts"
                );

            return;

        }


        const gifts =
            data.gifts || [];


        /* =========================
           CALCULATE TOTALS
        ========================= */

        let totalEarned = 0;


        gifts.forEach(gift => {

            totalEarned +=
                Number(
                    gift.creatorEarning || 0
                );

        });


        document.getElementById(
            "totalEarned"
        ).innerText =
            totalEarned;


        document.getElementById(
            "giftsReceived"
        ).innerText =
            gifts.length;


        /* =========================
           EMPTY
        ========================= */

        if (gifts.length === 0) {

            message.innerText =
                "No gifts received yet.";

            giftList.innerHTML = `
                <div class="empty-gifts">

                    🎁

                    <h3>
                        No gifts yet
                    </h3>

                    <p>
                        Gifts from your supporters
                        will appear here.
                    </p>

                </div>
            `;

            return;

        }


        message.innerText =
            "✅ Gifts loaded successfully";


        giftList.innerHTML = "";


        /* =========================
           RENDER GIFTS
        ========================= */

        gifts.forEach(gift => {

            const sender =
                gift.senderId || {};


            const senderName =
                sender.username ||
                sender.name ||
                "Unknown User";


            const date =
                gift.createdAt
                    ? new Date(
                        gift.createdAt
                    ).toLocaleString(
                        "en-NG"
                    )
                    : "Unknown date";

           const giftIcons = {
    rose: "🌹",
    gift: "🎁",
    "gift-box": "🎁",
    heart: "💖",
    diamond: "💎",
    crown: "👑",
    rocket: "🚀",
    fire: "🔥",
    lion: "🦁",
    trophy: "🏆",
    star: "⭐",
    kiss: "💋",
    cake: "🎂",
    flower: "🌸",
    rainbow: "🌈",
    love: "❤️"
};

const giftIcon =
    giftIcons[
        String(gift.giftType || "")
            .toLowerCase()
    ] || "🎁";


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "gift-card";


            item.innerHTML = `

                <div class="gift-top">

                    <div class="gift-name">

                        🎁
                        ${giftIcon}
${escapeHTML(
    formatGiftName(
        gift.giftType
    )
)}

                    </div>


                    <div class="gift-coins">

                        ${Number(
                            gift.coins || 0
                        )}

                        coins

                    </div>

                </div>


                <div class="gift-info">

                    👤 From:
                    <strong>
                        ${escapeHTML(
                            senderName
                        )}
                    </strong>

                    <br>


                    💰 Creator earning:

                    <span class="gift-earning">

                        ${Number(
                            gift.creatorEarning || 0
                        )}

                        coins

                    </span>

                    <br>


                    📅
                    ${escapeHTML(date)}

                </div>

            `;


            giftList.appendChild(
                item
            );

        });


    } catch (err) {

        console.error(
            "CREATOR GIFTS ERROR:",
            err
        );


        message.innerText =
            "❌ Server connection error";

    }

}


/* =========================
   SAFE HTML
========================= */

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


function formatGiftName(value) {

    if (!value) {
        return "Gift";
    }

    return String(value)
        .replaceAll("-", " ")
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}

/* =========================
   START
========================= */

loadCreatorGifts();
