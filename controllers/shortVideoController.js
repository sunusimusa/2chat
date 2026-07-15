const ShortVideo = require("../models/ShortVideo");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Upload Short Video
exports.uploadVideo = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a video."
            });
        }

        const uploadResult = await new Promise((resolve, reject) => {

            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "video",
                    folder: "2chat/shorts"
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            streamifier.createReadStream(req.file.buffer).pipe(stream);

        });

        const short = await ShortVideo.create({

            username: req.body.username,

            avatar: req.body.avatar || "",

            caption: req.body.caption || "",

            category: req.body.category || "general",

            video: uploadResult.secure_url

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

// ================= SAVE / UNSAVE VIDEO =================
exports.saveVideo = async (req, res) => {

    try {

        console.log("BODY:", req.body);

        const { username, videoId } = req.body;

        const user = await User.findOne({ username });

        console.log("USER:", user);

        if (!user) {
            return res.json({
                success:false,
                message:"User not found"
            });
        }

        const video = await ShortVideo.findById(videoId);

        console.log("VIDEO:", video);

        if(!video){
            return res.json({
                success:false,
                message:"Video not found"
            });
        }

        console.log("Before Save:", user.savedVideos);

        const alreadySaved =
            user.savedVideos.some(
                id => id.toString() === videoId
            );

        if(alreadySaved){

            user.savedVideos =
                user.savedVideos.filter(
                    id => id.toString() !== videoId
                );

        }else{

            user.savedVideos.push(video._id);

        }

        await user.save();

        console.log("After Save:", user.savedVideos);

        res.json({
            success:true,
            saved:!alreadySaved
        });

    } catch(err){

        console.log(err);

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};

exports.getSavedVideos = async (req, res) => {

    try{

        const user = await User.findOne({
            username:req.params.username
        }).populate("savedVideos");

        if(!user){

            return res.json({
                success:false,
                message:"User not found"
            });

        }

        res.json({

            success:true,

            videos:user.savedVideos

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

exports.getForYouVideos = async (req, res) => {

    try{

        const user = await User.findOne({
            username: req.params.username
        });

        if(!user){

            return res.json({
                success:false,
                message:"User not found"
            });

        }

        let videos = await ShortVideo.find()
            .sort({ createdAt:-1 });

        // Videos daga mutanen da yake following su
        const followingVideos = videos.filter(v =>
            user.following.includes(v.username)
        );

        // Sauran videos
        const otherVideos = videos.filter(v =>
            !user.following.includes(v.username)
        );

        // For You Feed
        const favoriteCategories = {};

// Ƙididdige categories daga Saved Videos
const savedVideos = await ShortVideo.find({
    _id: { $in: user.savedVideos }
});

        // Ƙara maki daga videos da user ya yi Comment
videos.forEach(video => {

    const commented = video.comments.some(
        comment => comment.username === user.username
    );

    if(commented){

        favoriteCategories[video.category] =
            (favoriteCategories[video.category] || 0) + 2;

    }

});

        // Ƙara maki daga videos da user ya yi Like
videos.forEach(video => {

    if(video.likes.includes(user.username)){

        favoriteCategories[video.category] =
            (favoriteCategories[video.category] || 0) + 2;

    }

});

savedVideos.forEach(video => {

    favoriteCategories[video.category] =
        (favoriteCategories[video.category] || 0) + 1;

});

// Shirya sauran videos bisa category
otherVideos.sort((a, b) => {

    const scoreA = favoriteCategories[a.category] || 0;
    const scoreB = favoriteCategories[b.category] || 0;

    return scoreB - scoreA;

});

const feed = [
    ...followingVideos,
    ...otherVideos
];

        res.json({
            success:true,
            videos:feed
        });

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};
