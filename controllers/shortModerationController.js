const ShortVideo = require("../models/ShortVideo");

// ==========================================
// ADMIN: MODERATE SHORT VIDEO
// ==========================================

exports.moderateShort = async (req, res) => {
    try {
        const { action, reason } = req.body;
        const videoId = req.params.id;

        // Validate video ID
        if (
            typeof videoId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(videoId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid video ID."
            });
        }

        // Validate action
        const validActions = [
            "approve",
            "remove",
            "restore"
        ];

        if (!validActions.includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid moderation action."
            });
        }

        // Require a reason for removal
        if (
            action === "remove" &&
            (
                typeof reason !== "string" ||
!reason.trim() ||
reason.trim().length > 500
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Removal reason must be between 1 and 500 characters."
            });
        }

        const video = await ShortVideo.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Short video not found."
            });
        }

        // Prevent invalid state transitions
        if (
            action === "restore" &&
            video.moderationStatus !== "removed"
        ) {
            return res.status(400).json({
                success: false,
                message: "Only removed videos can be restored."
            });
        }

        if (
            action === "remove" &&
            video.moderationStatus === "removed"
        ) {
            return res.status(409).json({
                success: false,
                message: "This video is already removed."
            });
        }

        if (
            action === "approve" &&
            video.moderationStatus === "approved"
        ) {
            return res.status(409).json({
                success: false,
                message: "This video is already approved."
            });
        }

        // Apply moderation action
        if (action === "approve") {
            video.moderationStatus = "approved";
            video.moderationReason = "";
        }

        if (action === "remove") {
            video.moderationStatus = "removed";
            video.moderationReason = reason.trim();
        }

        if (action === "restore") {
            video.moderationStatus = "approved";
            video.moderationReason = "";
        }

        video.reviewedBy = req.admin._id;
        video.reviewedAt = new Date();

        // Keep moderation audit history
        if (!Array.isArray(video.moderationHistory)) {
    video.moderationHistory = [];
}

video.moderationHistory.push({
            action:
                action === "approve"
                    ? "approved"
                    : action === "remove"
                        ? "removed"
                        : "restored",

            reason:
                action === "remove"
                    ? reason.trim()
                    : `Admin ${action} action`,

            performedBy: req.admin._id,
            createdAt: new Date()
        });

        await video.save();

        return res.json({
            success: true,
            message: `Short video ${action} successful.`,
            video
        });

    } catch (err) {
        console.error("SHORT MODERATION ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to moderate short video."
        });
    }
};

// ==========================================
// ADMIN: GET PENDING SHORT VIDEOS
// ==========================================

exports.getPendingShorts = async (req, res) => {
    try {
        const videos = await ShortVideo.find({
            moderationStatus: "pending"
        })
        .select(
            "_id username avatar caption category hashtags video createdAt moderationStatus"
        )
        .sort({ createdAt: 1 })
        .limit(50)
        .lean();

        return res.json({
            success: true,
            count: videos.length,
            videos
        });

    } catch (err) {
        console.error("GET PENDING SHORTS ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to load pending Shorts."
        });
    }
};
