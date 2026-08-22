const User = require("../models/User");
const Monetization = require("../models/Monetization");
const Wallet = require("../models/Wallet");

// =====================================================
// GET ALL MONETIZATION APPLICATIONS
// =====================================================

exports.getMonetizationApplications = async (req, res) => {

    try {

        const applications =
            await Monetization.find({
                status: {
                    $in: [
                        "pending",
                        "approved",
                        "rejected",
                        "suspended"
                    ]
                }
            })
            .populate(
                "userId",
                "username email avatar createdAt"
            )
            .sort({
                appliedAt: -1,
                createdAt: -1
            });


        return res.json({

            success: true,

            count:
                applications.length,

            applications

        });


    } catch (err) {

        console.error(
            "ADMIN GET MONETIZATION APPLICATIONS ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load monetization applications."

        });

    }

};


// =====================================================
// GET SINGLE MONETIZATION APPLICATION
// =====================================================

exports.getMonetizationApplication =
async (req, res) => {

    try {

        const {
            userId
        } = req.params;


        const monetization =
            await Monetization.findOne({
                userId
            })
            .populate(
                "userId",
                "username email avatar createdAt followers"
            );


        if (!monetization) {

            return res.status(404).json({

                success: false,

                message:
                    "Monetization record not found."

            });

        }


        return res.json({

            success: true,

            monetization

        });


    } catch (err) {

        console.error(
            "ADMIN GET MONETIZATION APPLICATION ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load monetization application."

        });

    }

};


// =====================================================
// APPROVE MONETIZATION
// =====================================================

exports.approveMonetization =
async (req, res) => {

    try {

        const {
            userId
        } = req.params;


        const monetization =
            await Monetization.findOne({
                userId
            });


        if (!monetization) {

            return res.status(404).json({

                success: false,

                message:
                    "Monetization record not found."

            });

        }


        // =========================================
        // MUST BE PENDING
        // =========================================

        if (
            monetization.status !==
            "pending"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Application cannot be approved because its current status is "${monetization.status}".`

            });

        }


        // =========================================
        // APPROVE
        // =========================================

        monetization.status =
            "approved";

        monetization.reviewedAt =
            new Date();

        monetization.rejectionReason =
            null;

        monetization.suspensionReason =
            null;

        let wallet = await Wallet.findOne({
    userId: monetization.userId
});

if (!wallet) {
    wallet = await Wallet.create({
        userId: monetization.userId,
        coins: 0,
        totalPurchased: 0,
        totalSpent: 0,
        totalEarned: 0,
        platformCommission: 0,
        availableBalance: 0,
        withdrawalLockedBalance: 0,
        totalWithdrawn: 0,
        giftsSent: 0,
        giftsReceived: 0
    });
}


        await monetization.save();


        return res.json({

            success: true,

            message:
                "Monetization application approved successfully.",

            monetization: {

                userId:
                    monetization.userId,

                eligible:
                    monetization.eligible,

                status:
                    monetization.status,

                eligibleAt:
                    monetization.eligibleAt,

                appliedAt:
                    monetization.appliedAt,

                reviewedAt:
                    monetization.reviewedAt

            }

        });


    } catch (err) {

        console.error(
            "ADMIN APPROVE MONETIZATION ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to approve monetization application."

        });

    }

};


// =====================================================
// REJECT MONETIZATION
// =====================================================

exports.rejectMonetization =
async (req, res) => {

    try {

        const {
            userId
        } = req.params;


        const {
            reason
        } = req.body;


        if (
            !reason ||
            !reason.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Rejection reason is required."

            });

        }


        const monetization =
            await Monetization.findOne({
                userId
            });


        if (!monetization) {

            return res.status(404).json({

                success: false,

                message:
                    "Monetization record not found."

            });

        }


        // =========================================
        // MUST BE PENDING
        // =========================================

        if (
            monetization.status !==
            "pending"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Application cannot be rejected because its current status is "${monetization.status}".`

            });

        }


        // =========================================
        // REJECT
        // =========================================

        monetization.status =
            "rejected";

        monetization.reviewedAt =
            new Date();

        monetization.rejectionReason =
            reason.trim();


        await monetization.save();


        return res.json({

            success: true,

            message:
                "Monetization application rejected.",

            monetization: {

                userId:
                    monetization.userId,

                eligible:
                    monetization.eligible,

                status:
                    monetization.status,

                rejectionReason:
                    monetization.rejectionReason,

                reviewedAt:
                    monetization.reviewedAt

            }

        });


    } catch (err) {

        console.error(
            "ADMIN REJECT MONETIZATION ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to reject monetization application."

        });

    }

};


// =====================================================
// SUSPEND MONETIZATION
// =====================================================

exports.suspendMonetization =
async (req, res) => {

    try {

        const {
            userId
        } = req.params;


        const {
            reason
        } = req.body;


        if (
            !reason ||
            !reason.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Suspension reason is required."

            });

        }


        const monetization =
            await Monetization.findOne({
                userId
            });


        if (!monetization) {

            return res.status(404).json({

                success: false,

                message:
                    "Monetization record not found."

            });

        }


        // =========================================
        // ONLY APPROVED CAN BE SUSPENDED
        // =========================================

        if (
            monetization.status !==
            "approved"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Only approved monetization accounts can be suspended. Current status is "${monetization.status}".`

            });

        }


        // =========================================
        // SUSPEND
        // =========================================

        monetization.status =
            "suspended";

        monetization.reviewedAt =
            new Date();

        monetization.suspensionReason =
            reason.trim();


        await monetization.save();


        return res.json({

            success: true,

            message:
                "Monetization account suspended.",

            monetization: {

                userId:
                    monetization.userId,

                status:
                    monetization.status,

                suspensionReason:
                    monetization.suspensionReason,

                reviewedAt:
                    monetization.reviewedAt

            }

        });


    } catch (err) {

        console.error(
            "ADMIN SUSPEND MONETIZATION ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to suspend monetization account."

        });

    }

};


// =====================================================
// RESTORE SUSPENDED MONETIZATION
// =====================================================

exports.restoreMonetization =
async (req, res) => {

    try {

        const {
            userId
        } = req.params;


        const monetization =
            await Monetization.findOne({
                userId
            });


        if (!monetization) {

            return res.status(404).json({

                success: false,

                message:
                    "Monetization record not found."

            });

        }


        // =========================================
        // MUST BE SUSPENDED
        // =========================================

        if (
            monetization.status !==
            "suspended"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Only suspended monetization accounts can be restored. Current status is "${monetization.status}".`

            });

        }


        // =========================================
        // RESTORE
        // =========================================

        monetization.status =
            "approved";

        monetization.reviewedAt =
            new Date();

        monetization.suspensionReason =
            null;


        await monetization.save();


        return res.json({

            success: true,

            message:
                "Monetization account restored successfully.",

            monetization: {

                userId:
                    monetization.userId,

                status:
                    monetization.status,

                reviewedAt:
                    monetization.reviewedAt

            }

        });


    } catch (err) {

        console.error(
            "ADMIN RESTORE MONETIZATION ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to restore monetization account."

        });

    }

};
