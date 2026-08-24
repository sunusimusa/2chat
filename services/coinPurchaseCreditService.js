const mongoose = require("mongoose");

const CoinPurchase =
    require("../models/CoinPurchase");

const Wallet =
    require("../models/Wallet");


// =====================================================
// CREDIT COIN PURCHASE
// =====================================================
//
// IMPORTANT:
//
// - Ana credit coins ne bayan Flutterwave verification.
// - Ba ya dogara da webhook sau ɗaya kawai.
// - Yana hana double credit.
// - Idan user tsoho ne kuma ba shi da Wallet,
//   za a ƙirƙiri masa Wallet automatically.
// - 100 Coins = ₦100 a tsarinmu.
// =====================================================

async function creditCoinPurchase(
    purchaseId,
    verifiedPayment
) {

    // =================================================
    // VALIDATION
    // =================================================

    if (!purchaseId) {

        throw new Error(
            "Purchase ID is required."
        );

    }


    if (!verifiedPayment) {

        throw new Error(
            "Verified payment data is required."
        );

    }


    // =================================================
    // START TRANSACTION
    // =================================================

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
                    await CoinPurchase
                        .findById(
                            purchaseId
                        )
                        .session(
                            session
                        );


                if (!purchase) {

                    throw new Error(
                        "Coin purchase not found."
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

                        purchaseId:
                            purchase._id,

                        coins:
                            purchase.coins

                    };

                    return;

                }


                // =====================================
                // PAYMENT MUST BE VERIFIED
                // =====================================

                if (
                    verifiedPayment.verified !==
                    true
                ) {

                    throw new Error(
                        verifiedPayment.reason ||
                        "Payment has not been verified."
                    );

                }


                // =====================================
                // VERIFY REFERENCE
                // =====================================

                const verifiedReference =
                    String(
                        verifiedPayment.reference ||
                        ""
                    )
                    .trim();


                const purchaseReference =
                    String(
                        purchase.reference ||
                        ""
                    )
                    .trim();


                if (
                    !verifiedReference ||
                    verifiedReference !==
                    purchaseReference
                ) {

                    throw new Error(
                        "Payment reference does not match purchase."
                    );

                }


                // =====================================
                // VERIFY AMOUNT
                // =====================================

                const paidAmount =
                    Number(
                        verifiedPayment.amount
                    );


                const purchaseAmount =
                    Number(
                        purchase.amount
                    );


                if (
                    !Number.isFinite(
                        paidAmount
                    ) ||
                    !Number.isFinite(
                        purchaseAmount
                    ) ||
                    paidAmount !==
                    purchaseAmount
                ) {

                    throw new Error(
                        "Payment amount does not match purchase amount."
                    );

                }


                // =====================================
                // VERIFY CURRENCY
                // =====================================

                const paidCurrency =
                    String(
                        verifiedPayment.currency ||
                        ""
                    )
                    .trim()
                    .toUpperCase();


                const purchaseCurrency =
                    String(
                        purchase.currency ||
                        "NGN"
                    )
                    .trim()
                    .toUpperCase();


                if (
                    paidCurrency !==
                    purchaseCurrency
                ) {

                    throw new Error(
                        "Payment currency does not match purchase currency."
                    );

                }


                // =====================================
                // VERIFY STATUS
                // =====================================

                const providerStatus =
                    String(
                        verifiedPayment.status ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                const successfulStatuses = [

                    "successful",

                    "succeeded",

                    "success",

                    "completed",

                    "paid"

                ];


                if (
                    !successfulStatuses.includes(
                        providerStatus
                    )
                ) {

                    throw new Error(
                        "Flutterwave payment was not successful."
                    );

                }


                // =====================================
                // VERIFY COINS
                // =====================================

                const coins =
                    Number(
                        purchase.coins
                    );


                if (
                    !Number.isFinite(
                        coins
                    ) ||
                    coins <= 0
                ) {

                    throw new Error(
                        "Invalid purchase coin amount."
                    );

                }


                // =====================================
                // 1 COIN = ₦1
                // =====================================

                if (
                    purchaseCurrency ===
                    "NGN"
                ) {

                    if (
                        coins !==
                        purchaseAmount
                    ) {

                        throw new Error(
                            "Coin amount does not match NGN purchase amount."
                        );

                    }

                }


                // =====================================
                // FIND WALLET
                // =====================================

                let wallet =
                    await Wallet.findOne({

                        userId:
                            purchase.userId

                    })
                    .session(
                        session
                    );


                // =====================================
                // CREATE WALLET FOR LEGACY USER
                // =====================================

                if (!wallet) {

                    try {

                        wallet =
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
                            wallet[0];

                    } catch (walletError) {

                        // =================================
                        // RACE CONDITION PROTECTION
                        // =================================
                        //
                        // Idan wani request ya riga ya
                        // ƙirƙiri Wallet saboda unique index,
                        // mu sake nemo shi.
                        //

                        if (
                            walletError?.code ===
                            11000
                        ) {

                            wallet =
                                await Wallet.findOne({

                                    userId:
                                        purchase.userId

                                })
                                .session(
                                    session
                                );

                        } else {

                            throw walletError;

                        }

                    }

                }


                if (!wallet) {

                    throw new Error(
                        "Unable to create or find user wallet."
                    );

                }


                // =====================================
                // CREDIT WALLET
                // =====================================

                wallet.coins =
                    Number(
                        wallet.coins || 0
                    ) +
                    coins;


                wallet.totalPurchased =
                    Number(
                        wallet.totalPurchased || 0
                    ) +
                    coins;


                await wallet.save({
                    session
                });


                // =====================================
                // UPDATE PURCHASE
                // =====================================

                purchase.status =
                    "paid";


                purchase.providerStatus =
                    providerStatus;


                purchase.paymentReference =
                    verifiedReference;


                if (
                    verifiedPayment.chargeId
                ) {

                    purchase.flutterwaveChargeId =
                        String(
                            verifiedPayment.chargeId
                        );

                }


                purchase.paymentCompletedAt =
                    new Date();


                purchase.paymentVerifiedAt =
                    new Date();


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

                    purchaseId:
                        purchase._id,

                    userId:
                        purchase.userId,

                    coins,

                    amount:
                        purchaseAmount,

                    currency:
                        purchaseCurrency,

                    status:
                        purchase.status

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
