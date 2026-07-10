const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true
    },

    avatar: {
        type: String,
        default: ""
    },

    media: {
        type: String,
        default: ""
    },

    mediaType: {
        type: String,
        enum: ["image", "video", "text"],
        default: "image"
    },

    text: {
        type: String,
        default: ""
    },

    views: [{
        username: String,
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],

    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

}, {
    timestamps: true
});

// Status zai goge kansa bayan awa 24
statusSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("Status", statusSchema);
