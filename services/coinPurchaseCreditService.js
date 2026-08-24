/**
 * =====================================================
 * 2CHAT
 * COIN PURCHASE CREDIT SERVICE
 * =====================================================
 *
 * Wannan service ne kawai zai:
 *
 * - tabbatar da payment result
 * - ƙara coins cikin Wallet
 * - ƙara totalPurchased
 * - sanya purchase = paid
 * - hana double credit
 *
 * 100 Coins = ₦100
 *
 * Legacy user:
 * Idan Wallet babu, za a ƙirƙira masa.
 * =====================================================
 */

const mongoose =
    require("mongoose");

const CoinPurchase =
    require("../models/CoinPurchase");

const Wallet =
    require("../models/Wallet");


// =====================================================
// SUCCESSFUL PAYMENT STATUSES
// =====================================================

const SUCCESSFUL_STATUSES = [

    "successful",
    "succeeded",
    "success",
    "completed",
    "paid"

];


// =====================================================
// CREDIT COIN PURCHASE
// =====================================================

async function creditCoinPurchase(
    purchaseId,
    verifiedPayment
) {

    if (!purchaseId) {

        throw new Error(
            "Purchase ID is required."
        );

    }

    if (!verifiedPayment) {

        throw new Error(
            "Verified payment is required."
        );

    }

    const session =
        await mongoose.startSession();

    try {

        let result = null;

        await session.withTransaction(
            async () => {

                // =====================================
                // FIND PURCHASE
                // =====================================

                const purchase =
                    await CoinPurchase.findById(
                        purchaseId
                    )
                    .session(session);

                if (!purchase) {

                    throw new Error(
                        "Coin purchase order not found."
                    );

                }


                // =====================================
                // ALREADY CREDITED
                // =====================================

                if (
                    purchase.coinsCredited ===
                    true
                ) {

                    result = {

                        alreadyCredited:
                            true,

                        purchase,

                        wallet:
                            null

                    };

                    return;

                }


                // =====================================
                // VERIFY REFERENCE
                // =====================================

                if (
                    String(
                        verifiedPayment.reference ||
                        ""
                    ) !==
                    String(
                        purchase.reference
                    )
                ) {

                    throw new Error(
                        "Payment reference does not match purchase."
                    );

                }


                // =====================================
                // VERIFY AMOUNT
                // =====================================

                const expectedAmount =
                    Number(
                        purchase.amount
                    );

                const paidAmount =
                    Number(
                        verifiedPayment.amount
                    );

                if (
                    !Number.isFinite(
                        paidAmount
                    ) ||
                    paidAmount !==
                    expectedAmount
                ) {

                    throw new Error(
                        "Payment amount does not match purchase amount."
                    );

                }


                // =====================================
                // VERIFY CURRENCY
                // =====================================

                const expectedCurrency =
                    String(
                        purchase.currency ||
                        "NGN"
                    ).toUpperCase();

                const paidCurrency =
                    String(
                        verifiedPayment.currency ||
                        ""
                    ).toUpperCase();

                if (
                    paidCurrency !==
                    expectedCurrency
                ) {

                    throw new Error(
                        "Payment currency does not match purchase currency."
                    );

                }


                // =====================================
                // VERIFY STATUS
                // =====================================

                const paymentStatus =
                    String(
                        verifiedPayment.status ||
                        ""
                    ).toLowerCase();

                if (
                    !SUCCESSFUL_STATUSES.includes(
                        paymentStatus
                    )
                ) {

                    throw new Error(
                        `Payment is not successful. Current status: ${paymentStatus}`
                    );

                }


                // =====================================
                // FIND WALLET
                // =====================================

                let wallet =
                    await Wallet.findOne({
                        userId:
                            purchase.userId
                    })
                    .session(session);


                // =====================================
                // LEGACY USER
                // CREATE WALLET
                // =====================================

                if (!wallet) {

                    const created =
                        await Wallet.create(
                            [
                                {

                                    userId:
                                        purchase.userId,

                                    coins:
                                        0,

                                    totalPurchased:
                                        0

                                }
                            ],
                            {
                                session
                            }
                        );

                    wallet =
                        created[0];

                }


                // =====================================
                // COINS
                // =====================================

                const coins =
                    Number(
                        purchase.coins
                    );

                if (
                    !Number.isFinite(coins) ||
                    coins <= 0
                ) {

                    throw new Error(
                        "Invalid purchase coin amount."
                    );

                }


                // =====================================
                // ADD COINS
                // =====================================

                wallet.coins =
                    Number(
                        wallet.coins || 0
                    ) +
                    coins;


                // =====================================
                // ADD TOTAL PURCHASED
                // =====================================

                wallet.totalPurchased =
                    Number(
                        wallet.totalPurchased || 0
                    ) +
                    coins;


                await wallet.save({
                    session
                });


                // =====================================
                // MARK PURCHASE PAID
                // =====================================

                purchase.status =
                    "paid";

                purchase.providerStatus =
                    paymentStatus;

                purchase.paymentReference =
                    purchase.paymentReference ||
                    verifiedPayment.reference;

                purchase.paymentCompletedAt =
                    purchase.paymentCompletedAt ||
                    new Date();

                purchase.paymentVerifiedAt =
                    new Date();


                // =====================================
                // SAVE CHARGE ID
                // =====================================

                if (
                    verifiedPayment.id
                ) {

                    purchase.flutterwaveChargeId =
                        String(
                            verifiedPayment.id
                        );

                }


                // =====================================
                // CREDIT FLAG
                // =====================================

                purchase.coinsCredited =
                    true;

                purchase.coinsCreditedAt =
                    new Date();


                await purchase.save({
                    session
                });


                // =====================================
                // RESULT
                // =====================================

                result = {

                    alreadyCredited:
                        false,

                    purchase,

                    wallet

                };

            }
        );


        return result;

    } finally {

        await session.endSession();

    }

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    creditCoinPurchase

};
