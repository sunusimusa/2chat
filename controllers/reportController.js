const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");
const Post = require("../models/Post");
const ShortVideo = require("../models/ShortVideo");

const VALID_CONTENT_TYPES = ["profile", "post", "short", "message", "group_message"];
const VALID_REASONS = ["child_safety", "csam", "grooming", "sexual_exploitation", "sexualization_of_minors", "threats", "harassment", "spam", "other"];
const CHILD_SAFETY_REASONS = ["child_safety", "csam", "grooming", "sexual_exploitation", "sexualization_of_minors"];
const REQUIRED_CHECKS = [
    "content_verified",
    "evidence_reviewed",
    "policy_matched",
    "risk_assessed",
    "proportional_action",
    "decision_reason_recorded"
];

const createReport = async (req, res) => {
    try {
        const { reportedUser, contentType, contentId, reason, description } = req.body;
        if (!VALID_CONTENT_TYPES.includes(contentType)) {
            return res.status(400).json({ success: false, message: "Invalid content type" });
        }
        if (!VALID_REASONS.includes(reason)) {
            return res.status(400).json({ success: false, message: "Invalid report reason" });
        }
        if (CHILD_SAFETY_REASONS.includes(reason) && (!description || !description.trim())) {
            return res.status(400).json({ success: false, message: "Please provide details for this child safety report" });
        }
        if (reportedUser) {
            if (!mongoose.Types.ObjectId.isValid(reportedUser)) {
                return res.status(400).json({ success: false, message: "Invalid reported user" });
            }
            const target = await User.findById(reportedUser).select("_id");
            if (!target) return res.status(404).json({ success: false, message: "Reported user not found" });
            if (String(req.user._id) === String(reportedUser)) {
                return res.status(400).json({ success: false, message: "You cannot report yourself" });
            }
        }
        if (contentId && !mongoose.Types.ObjectId.isValid(contentId)) {
            return res.status(400).json({ success: false, message: "Invalid content ID" });
        }
        if (contentId) {
            const duplicate = await Report.findOne({
                reportedBy: req.user._id, reportedUser: reportedUser || null,
                contentType, contentId, reason, status: { $in: ["pending", "reviewed"] }
            });
            if (duplicate) return res.status(409).json({ success: false, message: "You have already submitted this report" });
        }
        const report = await Report.create({
            reportedBy: req.user._id, reportedUser: reportedUser || null,
            contentType, contentId: contentId || null, reason,
            description: typeof description === "string" ? description.trim().slice(0, 2000) : ""
        });
        return res.status(201).json({ success: true, message: "Report submitted successfully", reportId: report._id });
    } catch (err) {
        console.error("CREATE REPORT ERROR:", err);
        return res.status(500).json({ success: false, message: "Failed to submit report" });
    }
};

const getReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate("reportedBy", "username avatar")
            .populate("reportedUser", "username avatar role isSuspended suspendedUntil")
            .populate("reviewedBy", "username")
            .sort({ createdAt: -1 }).limit(500).lean();
        return res.json({ success: true, count: reports.length, reports });
    } catch (err) {
        console.error("GET REPORTS ERROR:", err);
        return res.status(500).json({ success: false, message: "Failed to load reports" });
    }
};

const updateReport = async (req, res) => {
    try {
        const { action, adminNote, suspensionDays, checklist } = req.body;
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid report ID" });
        }
        const allowedActions = ["mark_reviewed", "dismiss", "warn_user", "remove_content", "suspend_temporary", "suspend_permanent"];
        if (!allowedActions.includes(action)) {
            return res.status(400).json({ success: false, message: "Invalid moderation action" });
        }
        const note = typeof adminNote === "string" ? adminNote.trim() : "";
        if (note.length < 10 || note.length > 1000) {
            return res.status(400).json({ success: false, message: "Write a decision reason between 10 and 1000 characters." });
        }
        if (!Array.isArray(checklist) || REQUIRED_CHECKS.some(item => !checklist.includes(item))) {
            return res.status(400).json({ success: false, message: "Complete every required investigation check before deciding." });
        }

        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });
        if (["action_taken", "dismissed"].includes(report.status)) {
            return res.status(409).json({ success: false, message: "This report has already been resolved." });
        }

        let targetUser = null;
        if (report.reportedUser) targetUser = await User.findById(report.reportedUser);
        if (targetUser && targetUser.role === "admin") {
            return res.status(403).json({ success: false, message: "The administrator account cannot be moderated through a user report." });
        }
        if (["warn_user", "suspend_temporary", "suspend_permanent"].includes(action) && !targetUser) {
            return res.status(400).json({ success: false, message: "This report has no valid reported user for an account action." });
        }

        let historyAction = "report_dismissed";
        let targetType = report.contentType;
        let targetId = report.contentId || report.reportedUser || null;
        let status = "reviewed";

        if (action === "dismiss") {
            status = "dismissed";
            historyAction = "report_dismissed";
        } else if (action === "mark_reviewed") {
            report.status = "reviewed";
        } else if (action === "warn_user") {
            historyAction = "user_warned";
            targetType = "user";
            targetId = targetUser._id;
            status = "action_taken";
        } else if (action === "suspend_temporary" || action === "suspend_permanent") {
            if (action === "suspend_temporary" && (!Number.isInteger(Number(suspensionDays)) || Number(suspensionDays) < 1 || Number(suspensionDays) > 365)) {
                return res.status(400).json({ success: false, message: "Temporary suspension must be between 1 and 365 days." });
            }
            targetUser.isSuspended = true;
            targetUser.suspensionReason = note;
            targetUser.suspendedBy = req.admin._id;
            targetUser.suspendedUntil = action === "suspend_temporary"
                ? new Date(Date.now() + Number(suspensionDays) * 86400000)
                : null;
            targetUser.online = false;
            await targetUser.save();
            historyAction = action === "suspend_permanent" ? "user_permanently_suspended" : "user_temporarily_suspended";
            targetType = "user";
            targetId = targetUser._id;
            status = "action_taken";
        } else if (action === "remove_content") {
            if (!report.contentId || !["post", "short"].includes(report.contentType)) {
                return res.status(400).json({ success: false, message: "Only reported Posts and Shorts can currently be removed from this review action. For private messages, use the applicable safety escalation process." });
            }
            if (report.contentType === "post") {
                const post = await Post.findById(report.contentId);
                if (!post) return res.status(404).json({ success: false, message: "Reported Post no longer exists." });
                if (targetUser && String(post.userId) !== String(targetUser._id)) {
                    return res.status(409).json({ success: false, message: "Reported Post owner does not match the reported account." });
                }
                post.isRemoved = true;
                post.moderationStatus = "removed";
                post.moderationReason = note;
                post.removedBy = req.admin._id;
                post.removedAt = new Date();
                await post.save();
            } else {
                const short = await ShortVideo.findById(report.contentId);
                if (!short) return res.status(404).json({ success: false, message: "Reported Short no longer exists." });
                if (targetUser && String(short.userId) !== String(targetUser._id)) {
                    return res.status(409).json({ success: false, message: "Reported Short owner does not match the reported account." });
                }
                short.moderationStatus = "removed";
                short.moderationReason = note;
                short.reviewedBy = req.admin._id;
                short.reviewedAt = new Date();
                short.moderationHistory.push({ action: "removed", reason: note, performedBy: req.admin._id });
                await short.save();
            }
            historyAction = "content_removed";
            status = "action_taken";
        }

        report.status = status;
        report.adminNote = note;
        report.reviewedBy = req.admin._id;
        report.reviewedAt = new Date();
        if (action !== "mark_reviewed") {
            report.actionHistory.push({
                action: historyAction,
                targetType: ["profile", "post", "short", "message", "group_message", "user"].includes(targetType) ? targetType : "user",
                targetId,
                reason: note,
                performedBy: req.admin._id
            });
        }
        await report.save();
        return res.json({ success: true, message: "Moderation decision saved.", report });
    } catch (err) {
        console.error("UPDATE REPORT ERROR:", err);
        return res.status(500).json({ success: false, message: "Failed to save moderation decision" });
    }
};

module.exports = { createReport, getReports, updateReport };
