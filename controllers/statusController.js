const Status = require("../models/Status");

// ================= CREATE STATUS =================
exports.createStatus = async (req, res) => {

    try {

        const {
            username,
            avatar,
            media,
            mediaType,
            text
        } = req.body;

        const status = await Status.create({
            username,
            avatar,
            media,
            mediaType,
            text
        });

        res.json({
            success: true,
            status
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


// ================= GET ALL STATUS =================
exports.getStatuses = async (req, res) => {

    try {

        const statuses = await Status.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            statuses
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


// ================= GET ONE STATUS =================
exports.getStatusById = async (req, res) => {

    try {

        const status = await Status.findById(req.params.id);

        if (!status) {

            return res.json({
                success: false,
                message: "Status not found"
            });

        }

        res.json({
            success: true,
            status
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


// ================= VIEW STATUS =================
exports.viewStatus = async (req, res) => {

    try {

        const { id } = req.params;
        const { username } = req.body;

        const status = await Status.findById(id);

        if (!status) {

            return res.json({
                success: false,
                message: "Status not found"
            });

        }

        const viewed = status.views.find(
            v => v.username === username
        );

        if (!viewed) {

            status.views.push({
                username
            });

            await status.save();

        }

        res.json({
            success: true,
            views: status.views.length
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};
