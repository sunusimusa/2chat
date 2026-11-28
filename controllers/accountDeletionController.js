const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Withdrawal = require("../models/Withdrawal");

const DELETION_GRACE_DAYS = 30;

exports.requestAccountDeletion = async (req, res) => {
    try {
        const password = req.body && req.body.password;

        if (typeof password !== "string" || !password) {
            return res.status(400).json({
                success: false,
                message: "Enter your password to confirm account deletion."
            });
        }

        const user = await User.findById(req.user._id).select("+password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Account not found."
            });
        }

        if (user.deletionScheduledFor && user.deletionScheduledFor > new Date()) {
            return res.status(409).json({
                success: false,
                accountDeletionPending: true,
                deletionScheduledFor: user.deletionScheduledFor,
                message: "An account deletion request is already pending."
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "The password you entered is incorrect."
            });
        }

        const activeWithdrawal = await Withdrawal.exists({
            userId: user._id,
            status: { $in: ["pending", "processing"] }
        });

        if (activeWithdrawal) {
            return res.status(409).json({
                success: false,
                message: "Please wait until your pending withdrawal is completed before deleting your account."
            });
        }

        const wallet = await Wallet.findOne({ userId: user._id }).lean();
        if (wallet && (
            Number(wallet.availableBalance || 0) > 0 ||
            Number(wallet.withdrawalLockedBalance || 0) > 0
        )) {
            return res.status(409).json({
                success: false,
                financialBalancePending: true,
                message: "Your creator wallet still has a cash balance. Withdraw or resolve this balance before requesting account deletion."
            });
        }

        const requestedAt = new Date();
        const scheduledFor = new Date(requestedAt);
        scheduledFor.setDate(scheduledFor.getDate() + DELETION_GRACE_DAYS);

        user.deletionRequestedAt = requestedAt;
        user.deletionScheduledFor = scheduledFor;
        user.online = false;
        user.lastSeen = requestedAt;
        await user.save();

        return res.status(202).json({
            success: true,
            deletionRequestedAt: requestedAt,
            deletionScheduledFor: scheduledFor,
            gracePeriodDays: DELETION_GRACE_DAYS,
            message: "Your account is scheduled for deletion. You can cancel this request within 30 days."
        });
    } catch (error) {
        console.error("ACCOUNT DELETION REQUEST ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to submit your account deletion request. Please try again."
        });
    }
};

exports.cancelAccountDeletion = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Account not found."
            });
        }

        if (!user.deletionScheduledFor) {
            return res.status(400).json({
                success: false,
                message: "There is no pending account deletion request."
            });
        }

        if (user.deletionScheduledFor <= new Date()) {
            return res.status(410).json({
                success: false,
                message: "The deletion period has ended and the account can no longer be restored."
            });
        }

        user.deletionRequestedAt = null;
        user.deletionScheduledFor = null;
        user.online = true;
        user.lastSeen = new Date();
        await user.save();

        return res.json({
            success: true,
            message: "Your account deletion request has been cancelled. Your account is active again."
        });
    } catch (error) {
        console.error("CANCEL ACCOUNT DELETION ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to cancel account deletion. Please try again."
        });
    }
};
