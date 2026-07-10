const ShortVideo = require("../models/ShortVideo");

// ================= UPLOAD VIDEO =================

exports.uploadVideo = async (req, res) => {

    try {

        const {
            username,
            avatar,
            caption,
            video
        } = req.body;

        const newVideo = await ShortVideo.create({

            username,
            avatar,
            caption,
            video

        });

        res.json({

            success: true,
            video: newVideo

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

};


// ================= GET ALL VIDEOS =================

exports.getVideos = async (req, res) => {

    try {

        const videos = await ShortVideo.find()
            .sort({ createdAt: -1 });

        res.json({

            success: true,
            videos

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

};


// ================= LIKE VIDEO =================

exports.likeVideo = async (req, res) => {

    try {

        const { videoId, username } = req.body;

        const video = await ShortVideo.findById(videoId);

        if (!video) {

            return res.json({

                success: false,
                message: "Video not found"

            });

        }

        if (video.likes.includes(username)) {

            video.likes = video.likes.filter(
                u => u !== username
            );

        } else {

            video.likes.push(username);

        }

        await video.save();

        res.json({

            success: true,
            likes: video.likes.length

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

};


// ================= COMMENT =================

exports.commentVideo = async (req, res) => {

    try {

        const {
            videoId,
            username,
            text
        } = req.body;

        const video = await ShortVideo.findById(videoId);

        if (!video) {

            return res.json({

                success: false,
                message: "Video not found"

            });

        }

        video.comments.push({

            username,
            text

        });

        await video.save();

        res.json({

            success: true,
            comments: video.comments

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

};


// ================= VIEW =================

exports.addView = async (req, res) => {

    try {

        const video = await ShortVideo.findById(req.params.id);

        if (!video) {

            return res.json({

                success: false,
                message: "Video not found"

            });

        }

        video.views += 1;

        await video.save();

        res.json({

            success: true,
            views: video.views

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

};
