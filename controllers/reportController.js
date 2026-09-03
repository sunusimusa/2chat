const Report = require("../models/Report");
const User = require("../models/User");


// =====================================================
// CREATE REPORT
// =====================================================

const createReport = async (req, res) => {

    try {

        const {
            reportedUser,
            contentType,
            contentId,
            reason,
            description
        } = req.body;


        const validContentTypes = [
            "profile",
            "post",
            "short",
            "message",
            "group_message"
        ];


        const validReasons = [
            "child_safety",
            "csam",
            "grooming",
            "sexual_exploitation",
            "sexualization_of_minors",
            "threats",
            "harassment",
            "spam",
            "other"
        ];


        // =================================================
        // VALIDATE CONTENT TYPE
        // =================================================

        if (
            !contentType ||
            !validContentTypes.includes(contentType)
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid content type"
            });

        }


        // =================================================
        // VALIDATE REASON
        // =================================================

        if (
            !reason ||
            !validReasons.includes(reason)
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid report reason"
            });

        }


        // =================================================
        // CHILD SAFETY REPORT REQUIRES DESCRIPTION
        // =================================================

        const childSafetyReasons = [
            "child_safety",
            "csam",
            "grooming",
            "sexual_exploitation",
            "sexualization_of_minors"
        ];


        if (
            childSafetyReasons.includes(reason) &&
            (!description || !description.trim())
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please provide details for this child safety report"
            });

        }


        // =================================================
        // VALIDATE REPORTED USER
        // =================================================

        if (reportedUser) {

            const userExists =
                await User.exists({
                    _id: reportedUser
                });


            if (!userExists) {

                return res.status(404).json({
                    success: false,
                    message: "Reported user not found"
                });

            }


            if (
                req.user._id.toString() ===
                reportedUser.toString()
            ) {

                return res.status(400).json({
                    success: false,
                    message: "You cannot report yourself"
                });

            }

        }


        // =================================================
        // VALIDATE CONTENT ID
        // =================================================

        if (contentId) {

            if (
                !/^[0-9a-fA-F]{24}$/.test(
                    String(contentId)
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid content ID"
                });

            }

        }


        // =================================================
        // PREVENT DUPLICATE REPORT
        // =================================================

        if (contentId) {

            const duplicateReport =
                await Report.findOne({

                    reportedBy:
                        req.user._id,

                    reportedUser:
                        reportedUser || null,

                    contentType,

                    contentId,

                    reason,

                    status: {
                        $in: [
                            "pending",
                            "reviewed"
                        ]
                    }

                });


            if (duplicateReport) {

                return res.status(409).json({
                    success: false,
                    message:
                        "You have already submitted this report"
                });

            }

        }


        // =================================================
        // CREATE REPORT
        // =================================================

        const report =
            await Report.create({

                reportedBy:
                    req.user._id,

                reportedUser:
                    reportedUser || null,

                contentType,

                contentId:
                    contentId || null,

                reason,

                description:
                    description
                        ? description.trim()
                        : ""

            });


        return res.status(201).json({

            success: true,

            message:
                "Report submitted successfully",

            reportId:
                report._id

        });


    } catch (err) {

        console.error(
            "CREATE REPORT ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to submit report"

        });

    }

};



// =====================================================
// GET REPORTS - ADMIN
// =====================================================

const getReports = async (req, res) => {

    try {

        const reports =
            await Report.find()

                .populate(
                    "reportedBy",
                    "username avatar"
                )

                .populate(
                    "reportedUser",
                    "username avatar"
                )

                .populate(
                    "reviewedBy",
                    "username"
                )

                .sort({
                    createdAt: -1
                });


        return res.json({

            success: true,

            count:
                reports.length,

            reports

        });


    } catch (err) {

        console.error(
            "GET REPORTS ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load reports"

        });

    }

};



// =====================================================
// UPDATE REPORT - ADMIN
// =====================================================

const updateReport = async (req, res) => {

    try {

        const {
            status,
            adminNote
        } = req.body;


        const validStatuses = [
            "pending",
            "reviewed",
            "action_taken",
            "dismissed"
        ];


        if (
            !status ||
            !validStatuses.includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid report status"

            });

        }


        const report =
            await Report.findById(
                req.params.id
            );


        if (!report) {

            return res.status(404).json({

                success: false,

                message:
                    "Report not found"

            });

        }


        report.status =
            status;


        if (
            typeof adminNote === "string"
        ) {

            report.adminNote =
                adminNote.trim();

        }


        report.reviewedBy =
            req.user._id;


        report.reviewedAt =
            new Date();


        await report.save();


        return res.json({

            success: true,

            message:
                "Report updated successfully"

        });


    } catch (err) {

        console.error(
            "UPDATE REPORT ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to update report"

        });

    }

};


module.exports = {
    createReport,
    getReports,
    updateReport
};
