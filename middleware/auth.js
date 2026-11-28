const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Not authorized"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id)
            .select("-password +tokenVersion");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        // Legacy JWTs remain valid while tokenVersion is zero.
        // Password recovery increments it and invalidates older sessions.
        if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user.tokenVersion || 0)) {
            return res.status(401).json({ success:false, message:'Session expired. Please log in again.' });
        }

        // =========================================
        // ACCOUNT SUSPENSION CHECK
        // =========================================

        if (user.isSuspended) {

            // Check whether temporary suspension has expired
            if (
                user.suspendedUntil &&
                user.suspendedUntil <= new Date()
            ) {
                user.isSuspended = false;
                user.suspensionReason = "";
                user.suspendedUntil = null;
                user.suspendedBy = null;

                await user.save();
            } else {
                return res.status(403).json({
                    success: false,
                    suspended: true,
                    message: "Your account has been suspended.",
                    reason: user.suspensionReason || "Community Guidelines violation",
                    suspendedUntil: user.suspendedUntil
                });
            }
        }

        // Pending deletion accounts may only cancel their own request.
        if (
            user.deletionScheduledFor &&
            !(req.method === "POST" && req.path === "/cancel-deletion")
        ) {
            return res.status(403).json({
                success: false,
                accountDeletionPending: true,
                deletionScheduledFor: user.deletionScheduledFor,
                message: "This account is scheduled for deletion. Cancel the request to continue using 2Chat."
            });
        }

        req.user = user;
        next();

    } catch (err) {
        console.error("AUTH ERROR:", err);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

module.exports = protect;
                
