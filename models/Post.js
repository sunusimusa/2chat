const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    username: {
        type: String
    },

    avatar: {
        type: String,
        default: ""
    },

    text: {
        type: String,
        default: ""
    },

    image: {
        type: String,
        default: ""
    },

    video: {
        type: String,
        default: ""
    },

    likes: {
        type: [String],
        default: []
    },

        moderationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected", "removed"],
        default: "pending",
        index: true
    },

    moderationReason: {
        type: String,
        default: "",
        maxlength: 1000
    },

    isRemoved: {
        type: Boolean,
        default: false,
        index: true
    },

    removedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    removedAt: {
        type: Date,
        default: null
    },

    comments: {
        type: [
            {
                username: String,
                text: String,
                createdAt: {
                    type: Date,
                    default: Date.now
                },
                replies: {
                    type: [
                        {
                            username: String,
                            text: String,
                            createdAt: {
                                type: Date,
                                default: Date.now
                            }
                        }
                    ],
                    default: []
                }
            }
        ],
        default: []
    }

}, {
    timestamps: true
});

module.exports =
mongoose.model("Post", postSchema);
