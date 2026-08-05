const mongoose = require("mongoose");

const groupInvitationSchema = new mongoose.Schema({

    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },

    groupName: {
        type: String,
        required: true,
        trim: true
    },

    inviter: {
        type: String,
        required: true,
        trim: true
    },

    invitee: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        enum: [
            "pending",
            "accepted",
            "rejected"
        ],
        default: "pending"
    }

}, {
    timestamps: true
});


// Prevent duplicate pending invitations
groupInvitationSchema.index(
    {
        groupId: 1,
        invitee: 1,
        status: 1
    }
);


module.exports =
    mongoose.model(
        "GroupInvitation",
        groupInvitationSchema
    );
