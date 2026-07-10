const ShortVideo = require("../models/ShortVideo");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// Upload Short Video
exports.uploadVideo = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a video."
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "video",
            folder: "2chat/shorts"
        });

        fs.unlinkSync(req.file.path);

        const short = await ShortVideo.create({

            username: req.body.username,

            avatar: req.body.avatar || "",

            caption: req.body.caption || "",

            video: result.secure_url

        });

        res.json({
            success: true,
            video: short
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// Get Videos
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

// Like Video
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

// Comment
exports.commentVideo = async (req, res) => {

    try {

        const { videoId, username, text } = req.body;

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

// Add View
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
