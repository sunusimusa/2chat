/* =========================================
   2CHAT COIN PACKAGES
========================================= */

async function loadCoinPackages() {

    const container =
        document.getElementById("coinPackages");

    if (!container) {
        console.error(
            "coinPackages container not found"
        );
        return;
    }

    container.innerHTML = `
        <div class="loading">
            🔄 Loading coin packages...
        </div>
    `;

    try {

        const response =
            await fetch(
                "/api/coin-packages"
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            container.innerHTML = `
                <div class="message">
                    ❌ ${
                        data.message ||
                        "Failed to load coin packages."
                    }
                </div>
            `;

            return;
        }

        const packages =
            data.packages || [];

        if (!packages.length) {

            container.innerHTML = `
                <div class="message">
                    📭 No coin packages available.
                </div>
            `;

            return;
        }

        container.innerHTML =
            packages
                .map(
                    pkg => createPackageCard(pkg)
                )
                .join("");

    } catch (error) {

        console.error(
            "COIN PACKAGES ERROR:",
            error
        );

        container.innerHTML = `
            <div class="message">
                ❌ Unable to connect to server.
            </div>
        `;

    }

}


/* =========================================
   PACKAGE CARD
========================================= */

function createPackageCard(pkg) {

    const coins =
        Number(pkg.coins || 0);

    const price =
        Number(pkg.price || coins);

    return `

        <div class="coin-package">

            <div class="package-icon">
                🪙
            </div>

            <h3>
                ${coins.toLocaleString()} Coins
            </h3>

            <div class="package-price">
                ₦${price.toLocaleString(
                    "en-NG",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                )}
            </div>

            <button
                onclick="selectCoinPackage('${pkg._id}')"
            >
                Buy Now
            </button>

        </div>

    `;

}


/* =========================================
   SELECT PACKAGE
========================================= */

function selectCoinPackage(
    packageId
) {

    console.log(
        "Selected coin package:",
        packageId
    );

    /*
    Payment system ba mu fara ba.
    A yanzu kawai muna tabbatar da cewa
    package ɗin yana aiki.

    Daga baya za mu haɗa:

    package
       ↓
    Payment
       ↓
    Verification
       ↓
    Add Coins
       ↓
    Wallet
    */

    alert(
        "🪙 Package selected successfully.\n\n" +
        "Payment system zai biyo baya."
    );

}


/* =========================================
   START
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadCoinPackages
);
