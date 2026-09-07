/**
 * =====================================================
 * 2CHAT
 * COIN PURCHASE CREDIT SERVICE
 * =====================================================
 *
 * Wannan service:
 *
 * - yana tabbatar da Paystack payment result
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
                //
                // CoinPurchase amount:
                // ₦100
                //
                // Paystack amount:
                // 10000 kobo
                //
                // Therefore:
                //
                // purchase.amount * 100
                //
                // =====================================

                const expectedAmount =
                    Math.round(
                        Number(
                            purchase.amount
                        ) * 100
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
                    )
                        .trim()
                        .toUpperCase();


                const paidCurrency =
                    String(
                        verifiedPayment.currency ||
                        ""
                    )
                        .trim()
                        .toUpperCase();


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
                    )
                        .trim()
                        .toLowerCase();


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


                // =====================================
                // SAVE WALLET
                // =====================================

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


                // =====================================
                // WEBHOOK RECEIVED
                // =====================================

                purchase.webhookReceived =
    true;

purchase.webhookReceivedAt =
    purchase.webhookReceivedAt ||
    new Date();

                // =====================================
                // PAYSTACK TRANSACTION ID
                // =====================================

                if (
                    verifiedPayment.id
                ) {

                    purchase.paystackTransactionId =
                        String(
                            verifiedPayment.id
                        );

                }


                // =====================================
                // PAYSTACK ACCESS CODE
                // =====================================

                if (
                    verifiedPayment.access_code
                ) {

                    purchase.paystackAccessCode =
                        String(
                            verifiedPayment.access_code
                        );

                }


                // =====================================
                // SAVE PURCHASE
                // =====================================

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
