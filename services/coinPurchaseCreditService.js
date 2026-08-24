/**
 * =====================================================
 * 2CHAT
 * COIN PURCHASE CREDIT SERVICE
 * =====================================================
 *
 * Wannan service:
 *
 * - yana tabbatar da payment result
 * - yana hana double credit
 * - yana ƙirƙirar Wallet ga legacy user idan babu
 * - yana ƙara coins
 * - yana ƙara totalPurchased
 * - yana canza purchase zuwa paid
 *
 * BA ya ƙara wallet.balance saboda Wallet schema
 * ɗinka ba shi da balance.
 * =====================================================
 */

const mongoose =
    require("mongoose");

const CoinPurchase =
    require("../models/CoinPurchase");

const Wallet =
    require("../models/Wallet");


// =====================================================
// SUCCESS STATUSES
// =====================================================

const SUCCESS_STATUSES = [

    "successful",

    "succeeded",

    "success",

    "completed",

    "paid"

];


// =====================================================
// CREDIT COINS
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
                // PURCHASE
                // =====================================

                const purchase =
                    await CoinPurchase
                        .findById(
                            purchaseId
                        )
                        .session(
                            session
                        );

                if (!purchase) {
                    throw new Error(
                        "Coin purchase order not found."
                    );
                }


                // =====================================
                // DOUBLE CREDIT PROTECTION
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
                // REFERENCE
                // =====================================

                const providerReference =
                    String(
                        verifiedPayment.reference ||
                        ""
                    ).trim();

                const purchaseReference =
                    String(
                        purchase.reference ||
                        ""
                    ).trim();

                if (
                    providerReference !==
                    purchaseReference
                ) {

                    throw new Error(
                        "Payment reference does not match purchase."
                    );
                }


                // =====================================
                // AMOUNT
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
                // CURRENCY
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
                // PAYMENT STATUS
                // =====================================

                const providerStatus =
                    String(
                        verifiedPayment.status ||
                        ""
                    ).toLowerCase();

                if (
                    !SUCCESS_STATUSES.includes(
                        providerStatus
                    )
                ) {

                    throw new Error(
                        `Payment is not successful. Current status: ${providerStatus || "unknown"}`
                    );
                }


                // =====================================
                // WALLET
                // =====================================

                let wallet =
                    await Wallet
                        .findOne({
                            userId:
                                purchase.userId
                        })
                        .session(
                            session
                        );


                // =====================================
                // LEGACY USER
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
                                        0,

                                    totalSpent:
                                        0,

                                    totalEarned:
                                        0,

                                    platformCommission:
                                        0,

                                    availableBalance:
                                        0,

                                    withdrawalLockedBalance:
                                        0,

                                    totalWithdrawn:
                                        0,

                                    giftsSent:
                                        0,

                                    giftsReceived:
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
                // ADD COINS
                // =====================================

                wallet.coins =
                    Number(
                        wallet.coins || 0
                    ) +
                    Number(
                        purchase.coins
                    );


                // =====================================
                // TOTAL PURCHASED
                // =====================================

                wallet.totalPurchased =
                    Number(
                        wallet.totalPurchased || 0
                    ) +
                    Number(
                        purchase.coins
                    );


                await wallet.save({
                    session
                });


                // =====================================
                // MARK PURCHASE PAID
                // =====================================

                purchase.status =
                    "paid";

                purchase.providerStatus =
                    providerStatus;

                purchase.paymentCompletedAt =
                    purchase.paymentCompletedAt ||
                    new Date();

                purchase.paymentVerifiedAt =
                    new Date();

                purchase.coinsCredited =
                    true;

                purchase.coinsCreditedAt =
                    new Date();

                purchase.webhookReceived =
                    purchase.webhookReceived ||
                    false;

                if (
                    verifiedPayment.id
                ) {

                    purchase.flutterwaveChargeId =
                        String(
                            verifiedPayment.id
                        );
                }

                if (
                    verifiedPayment.customerId
                ) {

                    purchase.flutterwaveCustomerId =
                        String(
                            verifiedPayment.customerId
                        );
                }


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
