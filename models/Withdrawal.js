const mongoose = require("mongoose");


const withdrawalSchema =
    new mongoose.Schema(
        {

            // =========================================
            // CREATOR / OWNER
            // =========================================

            userId: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "User",

                required: true,

                index: true

            },


            // =========================================
            // WITHDRAWAL AMOUNT
            // =========================================

            amount: {

                type: Number,

                required: true,

                min: 0

            },


            // =========================================
            // AMOUNT LOCKED FROM WALLET
            // =========================================

            lockedAmount: {

                type: Number,

                required: true,

                min: 0

            },


            // =========================================
            // WITHDRAWAL STATUS
            // =========================================

            status: {

                type: String,

                enum: [

                    "pending",

                    "processing",

                    "completed",

                    "failed",

                    "cancelled"

                ],

                default:
                    "pending",

                index: true

            },


            // =========================================
            // PAYMENT REFERENCE
            // =========================================

            payoutReference: {

                type: String,

                default: null,

                trim: true

            },


            // =========================================
            // PAYMENT PROVIDER
            // =========================================

            paymentProvider: {

                type: String,

                default: null,

                trim: true

            },


            // =========================================
            // FAILURE REASON
            // =========================================

            failureReason: {

                type: String,

                default: null,

                trim: true

            },


            // =========================================
            // PROCESSING STARTED
            // =========================================

            processingStartedAt: {

                type: Date,

                default: null

            },


            // =========================================
            // COMPLETED
            // =========================================

            completedAt: {

                type: Date,

                default: null

            },


            // =========================================
            // FAILED
            // =========================================

            failedAt: {

                type: Date,

                default: null

            },


            // =========================================
            // CANCELLED
            // =========================================

            cancelledAt: {

                type: Date,

                default: null

            }

        },

        {

            timestamps: true

        }

    );


// =========================================
// INDEXES
// =========================================

withdrawalSchema.index({

    userId: 1,

    createdAt: -1

});


withdrawalSchema.index({

    status: 1,

    createdAt: -1

});


// =========================================
// EXPORT
// =========================================

module.exports =
    mongoose.model(
        "Withdrawal",
        withdrawalSchema
    );
