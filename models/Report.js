const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        contentType: {
            type: String,
            enum: [
                "profile",
                "post",
                "short",
                "message",
                "group_message"
            ],
            required: true
        },

        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        reason: {
            type: String,
            enum: [
                "child_safety",
                "csam",
                "grooming",
                "sexual_exploitation",
                "sexualization_of_minors",
                "threats",
                "harassment",
                "spam",
                "other"
            ],
            required: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        },

        status: {
            type: String,
            enum: [
                "pending",
                "reviewed",
                "action_taken",
                "dismissed"
            ],
            default: "pending"
        },

        adminNote: {
            type: String,
            trim: true,
            maxlength: 2000,
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
        }
    },

    {
        timestamps: true
    }
);


// =====================================================
// INDEXES
// =====================================================

reportSchema.index({
    status: 1,
    createdAt: -1
});

reportSchema.index({
    reportedUser: 1,
    createdAt: -1
});

reportSchema.index({
    contentType: 1,
    contentId: 1
});


module.exports =
    mongoose.model(
        "Report",
        reportSchema
    );
