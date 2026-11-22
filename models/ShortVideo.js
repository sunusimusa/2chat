const mongoose = require("mongoose");

const shortVideoSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true
    },

    avatar: {
        type: String,
        default: ""
    },

    caption: {
        type: String,
        default: ""
    },

    category: {
        type: String,
        default: "general"
    },

    hashtags: {
        type: [String],
        default: []
    },

    video: {
        type: String,
        required: true
    },

    // ==============================
    // CONTENT MODERATION
    // ==============================

    moderationStatus: {
        type: String,
        enum: [
            "pending",
            "approved",
            "rejected",
            "removed"
        ],
        default: "pending",
        index: true
    },

    moderationReason: {
        type: String,
        default: ""
    },

    moderationDetails: {
        type: String,
        default: ""
    },

    moderationCategories: {
        type: [String],
        enum: [
            "nudity",
            "sexual_content",
            "child_safety",
            "graphic_violence",
            "gore",
            "threats",
            "harassment",
            "hate",
            "spam",
            "other"
        ],
        default: []
    },

    // ==============================
    // AI MODERATION SCAN QUEUE
    // ==============================

    moderationScanStatus: {
        type: String,
        enum: [
            "queued",
            "processing",
            "completed",
            "failed"
        ],
        default: "queued",
        index: true
    },

    moderationAttempts: {
        type: Number,
        default: 0
    },

    moderationNextAttemptAt: {
        type: Date,
        default: Date.now
    },

    moderationLockUntil: {
        type: Date,
        default: null
    },

    moderationScannedAt: {
        type: Date,
        default: null
    },

    moderationProvider: {
        type: String,
        default: ""
    },

    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    reviewedAt: {
        type: Date,
        default: null
    },

    moderationHistory: [{
        action: {
            type: String,
            enum: [
                "submitted",
                "screened",
                "approved",
                "rejected",
                "removed",
                "restored"
            ]
        },

        reason: {
            type: String,
            default: ""
        },

        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // ==============================
    // EXISTING SHORTS FEATURES
    // ==============================

    likes: {
        type: [String],
        default: []
    },

    comments: [{
        username: String,
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    views: {
        type: Number,
        default: 0
    },

    watchTime: {
        type: Number,
        default: 0
    },

    shares: {
        type: Number,
        default: 0
    },

    saves: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});

// ==============================
// DATABASE INDEXES
// ==============================

shortVideoSchema.index({
    moderationStatus: 1,
    createdAt: -1
});

shortVideoSchema.index({
    username: 1,
    moderationStatus: 1
});

shortVideoSchema.index({
    moderationScanStatus: 1,
    moderationNextAttemptAt: 1
});

module.exports = mongoose.model("ShortVideo", shortVideoSchema);
            
