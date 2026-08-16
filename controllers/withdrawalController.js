const mongoose = require("mongoose");

const Wallet = require("../models/Wallet");
const Withdrawal = require("../models/Withdrawal");


// =========================================
// CREATE WITHDRAWAL REQUEST
// =========================================

exports.createWithdrawal = async (req, res) => {

    const session =
        await mongoose.startSession();

    try {

        const { amount } = req.body;


        // =====================================
        // VALIDATION
        // =====================================

        const withdrawalAmount =
            Number(amount);


        if (
            !Number.isFinite(withdrawalAmount) ||
            withdrawalAmount <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid withdrawal amount"

            });

        }


        // =====================================
        // MINIMUM WITHDRAWAL
        // =====================================

        if (withdrawalAmount < 5000) {

            return res.status(400).json({

                success: false,

                message:
                    "Minimum withdrawal amount is ₦5,000"

            });

        }


        // =====================================
        // WHOLE NAIRA ONLY
        // =====================================

        if (
            !Number.isInteger(
                withdrawalAmount
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Withdrawal amount must be a whole number"

            });

        }


        // =====================================
        // START TRANSACTION
        // =====================================

        session.startTransaction();


        // =====================================
        // GET CREATOR WALLET
        // =====================================

        const wallet =
            await Wallet.findOne({
                userId: req.user._id
            }).session(session);


        if (!wallet) {

            throw new Error(
                "Wallet not found"
            );

        }


        // =====================================
        // CHECK AVAILABLE BALANCE
        // =====================================

        const availableBalance =
            Number(
                wallet.availableBalance || 0
            );


        if (
            availableBalance <
            withdrawalAmount
        ) {

            await session.abortTransaction();

            return res.status(400).json({

                success: false,

                message:
                    "Insufficient available balance",

                availableBalance

            });

        }


        // =====================================
        // LOCK BALANCE
        // =====================================

        wallet.availableBalance -=
            withdrawalAmount;


        wallet.withdrawalLockedBalance +=
            withdrawalAmount;


        // =====================================
        // CREATE WITHDRAWAL
        // =====================================

        const withdrawal =
            await Withdrawal.create(
                [
                    {

                        userId:
                            req.user._id,

                        amount:
                            withdrawalAmount,

                        status:
                            "pending",

                        lockedAmount:
                            withdrawalAmount

                    }
                ],
                {
                    session
                }
            );


        // =====================================
        // SAVE WALLET
        // =====================================

        await wallet.save({
            session
        });


        // =====================================
        // COMMIT
        // =====================================

        await session.commitTransaction();


        // =====================================
        // RESPONSE
        // =====================================

        return res.status(201).json({

            success: true,

            message:
                "Withdrawal request created successfully",

            withdrawal:
                withdrawal[0],

            wallet: {

                availableBalance:
                    wallet.availableBalance,

                withdrawalLockedBalance:
                    wallet.withdrawalLockedBalance,

                totalWithdrawn:
                    wallet.totalWithdrawn

            }

        });


    } catch (err) {


        // =====================================
        // ROLLBACK
        // =====================================

        try {

            await session.abortTransaction();

        } catch (abortError) {

            console.error(
                "WITHDRAWAL ABORT ERROR:",
                abortError
            );

        }


        console.error(
            "CREATE WITHDRAWAL ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message ||
                "Failed to create withdrawal request"

        });


    } finally {

        await session.endSession();

    }

};

// =========================================
// GET WITHDRAWAL HISTORY
// =========================================

exports.getWithdrawalHistory = async (req, res) => {

    try {

        const withdrawals =
            await Withdrawal.find({
                userId: req.user._id
            })
            .sort({
                createdAt: -1
            });


        return res.json({

            success: true,

            count:
                withdrawals.length,

            withdrawals

        });

    } catch (err) {

        console.error(
            "GET WITHDRAWAL HISTORY ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message ||
                "Failed to load withdrawal history"

        });

    }

};
