const Call = require("../models/Call");

exports.getCallHistory = async (req, res) => {
    try {
        const username = req.user.username;
        const calls = await Call.find({
            $or: [{ caller: username }, { receiver: username }]
        }).sort({ createdAt: -1 }).limit(100).lean();

        res.json({ success: true, calls });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to load call history."
        });
    }
};
