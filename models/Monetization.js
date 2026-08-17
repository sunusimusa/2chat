const mongoose = require("mongoose");

const monetizationSchema = new mongoose.Schema(
    {

        // =========================================
        // CREATOR
        // =========================================

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },


        // =========================================
        // ELIGIBILITY
        // =========================================

        eligible: {
            type: Boolean,
            default: false,
            index: true
        },

        // Ranar da creator ya fara zama eligible
        // Wannan shi ne zai taimaka wajen
        // grandfathering idan requirements sun canza.
        eligibleAt: {
            type: Date,
            default: null
        },


        // =========================================
        // MONETIZATION STATUS
        // =========================================

        status: {
            type: String,

            enum: [
                "not_eligible",
                "eligible",
                "pending",
                "approved",
                "rejected",
                "suspended"
            ],

            default: "not_eligible",

            index: true
        },


        // =========================================
        // APPLICATION
        // =========================================

        appliedAt: {
            type: Date,
            default: null
        },

        reviewedAt: {
            type: Date,
            default: null
        },


        // =========================================
        // REJECTION / SUSPENSION
        // =========================================

        rejectionReason: {
            type: String,
            default: null,
            trim: true
        },

        suspensionReason: {
            type: String,
            default: null,
            trim: true
        },


        // =========================================
        // ELIGIBILITY SNAPSHOT
        // =========================================
        // Za mu adana stats lokacin da creator
        // ya zama eligible.

        eligibilitySnapshot: {

            followers: {
                type: Number,
                default: 0
            },

            views: {
                type: Number,
                default: 0
            },

            watchTime: {
                type: Number,
                default: 0
            },

            earnings: {
                type: Number,
                default: 0
            },

            accountAgeDays: {
                type: Number,
                default: 0
            }

        }

    },

    {
        timestamps: true
    }
);


// =========================================
// INDEXES
// =========================================

monetizationSchema.index({
    eligible: 1,
    status: 1
});


// =========================================
// EXPORT
// =========================================

module.exports = mongoose.model(
    "Monetization",
    monetizationSchema
);
