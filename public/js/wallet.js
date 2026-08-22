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

    location.href =
        "/html/coinPackages.html";

}

/* =========================
   SEND GIFT
========================= */

function sendGift(){

    const receiverId =
        prompt("Saka Creator User ID:");

    if(!receiverId){
        return;
    }

    location.href =
        "/gifts.html?receiverId=" +
        encodeURIComponent(receiverId);

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

     async function testSendGift(){

    const token =
        localStorage.getItem("token");

    if(!token){
        return alert("❌ Login session expired");
    }

    // Wannan username/ID za mu canza zuwa creator na gwaji
    const receiverId =
        prompt("Saka User ID na wanda za a aika masa gift:");

    if(!receiverId){
        return;
    }

    try{

        const res = await fetch(
            "/api/gifts/send",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json",
                    "Authorization":
                        "Bearer " + token
                },

                body:JSON.stringify({
                    receiverId: receiverId,
                    giftType: "rose",
                    coins: 10
                })
            }
        );

        const data =
            await res.json();

        console.log(data);

        if(data.success){

            alert(
                "🎁 Gift sent!\n\n" +
                "Sender coins: " +
                data.senderCoins +
                "\nCreator earnings: " +
                data.creatorEarnings
            );

            loadWallet();

        }else{

            alert(
                "❌ " +
                (data.message || "Gift failed")
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

/* =========================
   OPEN WITHDRAWALS
========================= */

function openWithdrawals(){

    location.href =
        "/withdrawals.html";

}

