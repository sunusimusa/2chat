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
        // EARNINGS
        // =========================================

        totalEarned: {
            type: Number,
            default: 0,
            min: 0
        },

        availableEarnings: {
            type: Number,
            default: 0,
            min: 0
        },

        withdrawnAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        // =========================================
        // MONETIZED ACTIVITY
        // =========================================

        monetizedViews: {
            type: Number,
            default: 0,
            min: 0
        },

        monetizedVideos: {
            type: Number,
            default: 0,
            min: 0
        },

        // =========================================
        // MONETIZATION STATUS
        // =========================================

        status: {
            type: String,
            enum: [
                "not_eligible",
                "eligible",
                "active",
                "suspended"
            ],
            default: "not_eligible",
            index: true
        },

        // =========================================
        // ACTIVATION
        // =========================================

        activatedAt: {
            type: Date,
            default: null
        },

        lastEarningAt: {
            type: Date,
            default: null
        }

    },
    {
        timestamps: true
    }
);


// =========================================
// EXPORT
// =========================================

module.exports = mongoose.model(
    "Monetization",
    monetizationSchema
);
