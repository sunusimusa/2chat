const mongoose = require("mongoose");

const groupInvitationSchema = new mongoose.Schema(
    {

        // =========================================
        // GROUP
        // =========================================

        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
            index: true
        },


        // =========================================
        // WHO SENT THE INVITATION
        // =========================================

        inviter: {
            type: String,
            required: true,
            trim: true,
            index: true
        },


        // =========================================
        // WHO RECEIVED THE INVITATION
        // =========================================

        invitee: {
            type: String,
            required: true,
            trim: true,
            index: true
        },


        // =========================================
        // INVITATION STATUS
        // =========================================

        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "rejected"
            ],
            default: "pending",
            index: true
        },


        // =========================================
        // WHEN INVITATION WAS ACCEPTED/REJECTED
        // =========================================

        respondedAt: {
            type: Date,
            default: null
        }

    },
    {
        timestamps: true
    }
);


// =========================================
// PREVENT DUPLICATE PENDING INVITATIONS
// =========================================

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
