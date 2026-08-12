const user =
    JSON.parse(
        localStorage.getItem("user")
    );


/* =========================
   LOGIN CHECK
========================= */

if(!user){

    location.href =
        "/login.html";

}


/* =========================
   LOAD WALLET
========================= */

async function loadWallet(){

    try{

        const token =
            localStorage.getItem("token");


        if(!token){

            location.href =
                "/login.html";

            return;

        }


        const res =
            await fetch(
                "/api/wallet",
                {
                    method:"GET",

                    headers:{
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        const data =
            await res.json();


        if(data.success){

            const coins =
                data.wallet.coins || 0;

            const balance =
                data.wallet.balance || 0;


            document.getElementById(
                "coins"
            ).innerText =
                coins;


            document.getElementById(
                "balance"
            ).innerText =
                "₦" +
                Number(balance)
                    .toLocaleString(
                        "en-NG",
                        {
                            minimumFractionDigits:2,
                            maximumFractionDigits:2
                        }
                    );


            document.getElementById(
                "walletMessage"
            ).innerText =
                "Wallet loaded successfully";


        }else{

            document.getElementById(
                "walletMessage"
            ).innerText =
                data.message ||
                "Failed to load wallet";

        }


    }catch(err){

        console.error(
            "WALLET ERROR:",
            err
        );


        document.getElementById(
            "walletMessage"
        ).innerText =
            "Unable to load wallet";

    }

}


/* =========================
   BUY COINS
========================= */

function buyCoins(){

    alert(
        "Coin purchase system coming soon."
    );

}


/* =========================
   SEND GIFT
========================= */

function sendGift(){

    alert(
        "Gift system coming soon."
    );

}


async function testAddCoins(){

    const token =
        localStorage.getItem("token");

    if(!token){
        return alert("❌ Login session expired");
    }

    try{

        const res = await fetch(
            "/api/wallet/test-add-coins",
            {
                method: "POST",
                headers:{
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        const data = await res.json();

        if(data.success){

            alert(
                "✅ An ƙara 100 coins!\nCoins: " +
                data.coins
            );

            loadWallet();

        }else{

            alert(
                "❌ " +
                (data.message || "Failed")
            );

        }

    }catch(err){

        console.error(err);

        alert(
            "❌ Server connection error"
        );

    }

}

/* =========================
   START
========================= */

loadWallet();
