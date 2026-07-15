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

    video: {
        type: String,
        required: true
    },

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
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("ShortVideo", shortVideoSchema);
