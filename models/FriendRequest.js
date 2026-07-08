const mongoose = require("mongoose");

const friendRequestSchema = new mongoose.Schema(
{
    sender: {
        type: String,
        required: true
    },

    receiver: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }

},
{
    timestamps: true
}
);

module.exports = mongoose.model(
    "FriendRequest",
    friendRequestSchema
);
