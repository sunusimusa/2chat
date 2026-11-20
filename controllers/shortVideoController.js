const ShortVideo = require("../models/ShortVideo");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

/**
 * LEGACY SHORTS MODERATION MIGRATION
 *
 * Tsoffin videos da ba su da moderationStatus
 * za su koma pending domin admin ya sake duba su.
 */

exports.migrateLegacyShorts = async (req, res) => {
    try {
        const result = await ShortVideo.updateMany(
            {
                moderationStatus: { $exists: false }
            },
            {
                $set: {
                    moderationStatus: "pending",
                    moderationReason: "Legacy video awaiting moderation review",
                    moderationDetails: "This video requires admin review before public visibility."
                },
                $push: {
                    moderationHistory: {
                        action: "submitted",
                        reason: "Legacy video moved to moderation review",
                        performedBy: req.admin._id,
                        createdAt: new Date()
                    }
                }
            }
        );

        return res.json({
            success: true,
            message: "Legacy Shorts migration completed.",
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });

    } catch (err) {
        console.error("LEGACY SHORTS MIGRATION ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to migrate legacy Shorts."
        });
    }
};

// Upload Short Video
exports.uploadVideo = async (req, res) => {
    try {
        // Tabbatar cewa an zaɓi video
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a video."
            });
        }

        // Tabbatar da authenticated user
        if (!req.user || !req.user.username) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        // Ɗauko bayanan mai upload daga database/JWT
        const username = req.user.username;
        const avatar = req.user.avatar || "";

        // Karɓar caption da category kawai
        const caption = typeof req.body.caption === "string"
            ? req.body.caption.trim()
            : "";

        const category = typeof req.body.category === "string"
            ? req.body.category.trim()
            : "general";

        // Shirya hashtags
        let tags = [];

        if (typeof req.body.hashtags === "string") {
            tags = req.body.hashtags
                .split(/\s+/)
                .map(tag => tag.replace(/^#/, "").toLowerCase())
                .filter(tag => /^[a-z0-9_]{1,30}$/.test(tag))
                .slice(0, 20);
        }

        // Upload zuwa Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "video",
                    folder: "2chat/shorts"
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );

            streamifier
                .createReadStream(req.file.buffer)
                .pipe(stream);
        });

        // Ƙirƙirar Short da authenticated user
        const short = await ShortVideo.create({
            username,
            avatar,
            caption,
            category: category || "general",
            hashtags: tags,
            video: uploadResult.secure_url
        });

        return res.status(201).json({
            success: true,
            video: short
        });

    } catch (err) {
        console.error("SHORT VIDEO UPLOAD ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to upload video. Please try again."
        });
    }
};
                

// Get Videos

exports.getVideos = async (req, res) => {

    try {

        const videos = await ShortVideo.find({
            $or: [
                { moderationStatus: "approved" },
                { moderationStatus: { $exists: false } }
            ]
        })
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
        const { videoId } = req.body;
        const username = req.user.username;

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: "Video ID is required."
            });
        }

        const video = await ShortVideo.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

        if (
            video.moderationStatus &&
            video.moderationStatus !== "approved"
        ) {
            return res.status(403).json({
                success: false,
                message: "This video is not available."
            });
        }

        if (!Array.isArray(video.likes)) {
            video.likes = [];
        }

        if (video.likes.includes(username)) {
            video.likes = video.likes.filter(
                user => user !== username
            );
        } else {
            video.likes.push(username);
        }

        await video.save();

        return res.json({
            success: true,
            likes: video.likes.length,
            liked: video.likes.includes(username)
        });

    } catch (err) {
        console.error("LIKE VIDEO ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to update like. Please try again."
        });
    }
};
                
// Comment

exports.commentVideo = async (req, res) => {
    try {
        const { videoId, text } = req.body;
        const username = req.user.username;

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: "Video ID is required."
            });
        }

        if (
            typeof text !== "string" ||
            !text.trim() ||
            text.trim().length > 1000
        ) {
            return res.status(400).json({
                success: false,
                message: "Comment must be between 1 and 1000 characters."
            });
        }

        const video = await ShortVideo.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

        if (
            video.moderationStatus &&
            video.moderationStatus !== "approved"
        ) {
            return res.status(403).json({
                success: false,
                message: "This video is not available."
            });
        }

        if (!Array.isArray(video.comments)) {
            video.comments = [];
        }

        video.comments.push({
            username,
            text: text.trim()
        });

        await video.save();

        return res.json({
            success: true,
            comments: video.comments
        });

    } catch (err) {
        console.error("COMMENT VIDEO ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to post comment. Please try again."
        });
    }
};
        

// Add View

exports.addView = async (req, res) => {
    try {
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

        // Find video
        const video = await ShortVideo.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

        // Check moderation status
        if (
            video.moderationStatus &&
            video.moderationStatus !== "approved"
        ) {
            return res.status(403).json({
                success: false,
                message: "This video is not available."
            });
        }

        // Increase views
        video.views = (video.views || 0) + 1;

        await video.save();

        return res.json({
            success: true,
            views: video.views
        });

    } catch (err) {
        console.error("ADD VIEW ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to record video view."
        });
    }
};

// ================= SAVE / UNSAVE VIDEO =================

exports.saveVideo = async (req, res) => {
    try {
        const { videoId } = req.body;
        const userId = req.user._id;

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

        // Find user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Find video
        const video = await ShortVideo.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

        // Check moderation status
        if (
            video.moderationStatus &&
            video.moderationStatus !== "approved"
        ) {
            return res.status(403).json({
                success: false,
                message: "This video is not available."
            });
        }

        if (!Array.isArray(user.savedVideos)) {
            user.savedVideos = [];
        }

        const alreadySaved = user.savedVideos.some(
            id => id.toString() === videoId
        );

        if (alreadySaved) {
            user.savedVideos = user.savedVideos.filter(
                id => id.toString() !== videoId
            );

            video.saves = Math.max(
                0,
                (video.saves || 0) - 1
            );

            await user.save();
            await video.save();

            return res.json({
                success: true,
                saved: false,
                saves: video.saves
            });
        }

        user.savedVideos.push(video._id);
        video.saves = (video.saves || 0) + 1;

        await user.save();
        await video.save();

        return res.json({
            success: true,
            saved: true,
            saves: video.saves
        });

    } catch (err) {
        console.error("SAVE VIDEO ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to save video. Please try again."
        });
    }
};
            

exports.getSavedVideos = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId)
            .populate({
                 path: "savedVideos",
                 model: "ShortVideo",
                 match: {
                     $or: [
                        { moderationStatus:
             "approved" },
                          { moderationStatus:
            { $exists: false } }
                    ]
                 }
            });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.json({
            success: true,
            videos: (user.savedVideos || []).filter(Boolean)
        });

    } catch (err) {
        console.error("GET SAVED VIDEOS ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to load saved videos."
        });
    }
};


exports.getForYouVideos = async (req, res) => {
    try {
        // Gano user ta hanyar JWT, ba username daga URL ba
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        let videos = await ShortVideo.find({
            $or: [
                { moderationStatus:
        "approved" },
                 { moderationStatus:
        { $exists: false } }
            ]
        }).sort({ createdAt: -1 });

        const following = Array.isArray(user.following)
            ? user.following
            : [];

        const followingVideos = videos.filter(v =>
            following.includes(v.username)
        );

        const otherVideos = videos.filter(v =>
            !following.includes(v.username)
        );

        const favoriteCategories = {};

        // Categories daga Saved Videos
        const savedVideos = await ShortVideo.find({
    _id: { $in: user.savedVideos || [] },
    $or: [
        { moderationStatus: "approved" },
        { moderationStatus: { $exists: false } }
    ]
});

        // Ƙara maki daga Comments
        videos.forEach(video => {
            const commented = video.comments.some(
                comment => comment.username === user.username
            );

            if (commented) {
                favoriteCategories[video.category] =
                    (favoriteCategories[video.category] || 0) + 2;
            }
        });

        // Ƙara maki daga Likes
        videos.forEach(video => {
            if (video.likes.includes(user.username)) {
                favoriteCategories[video.category] =
                    (favoriteCategories[video.category] || 0) + 2;
            }
        });

        // Ƙara maki daga Saved Videos
        savedVideos.forEach(video => {
            favoriteCategories[video.category] =
                (favoriteCategories[video.category] || 0) + 1;
        });

        // Shirya sauran videos bisa category da engagement
        otherVideos.sort((a, b) => {
            let scoreA = favoriteCategories[a.category] || 0;
            let scoreB = favoriteCategories[b.category] || 0;

            scoreA += (a.watchTime || 0) / 100;
            scoreB += (b.watchTime || 0) / 100;

            scoreA += (a.likes?.length || 0);
            scoreB += (b.likes?.length || 0);

            scoreA += (a.comments?.length || 0) * 2;
            scoreB += (b.comments?.length || 0) * 2;

            scoreA += (a.views || 0) / 10;
            scoreB += (b.views || 0) / 10;

            return scoreB - scoreA;
        });

        const feed = [
            ...followingVideos,
            ...otherVideos
        ];

        return res.json({
            success: true,
            videos: feed
        });

    } catch (err) {
        console.error("GET FOR YOU VIDEOS ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to load For You videos."
        });
    }
};

exports.addWatchTime = async (req, res) => {
    try {
        const videoId = req.params.id;
        const { seconds } = req.body;

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

        // Validate watch time
        if (
            typeof seconds !== "number" ||
            !Number.isFinite(seconds) ||
            seconds <= 0 ||
            seconds > 30
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid watch time."
            });
        }

        // Find video
        const video = await ShortVideo.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

        // Check moderation status
        if (
            video.moderationStatus &&
            video.moderationStatus !== "approved"
        ) {
            return res.status(403).json({
                success: false,
                message: "This video is not available."
            });
        }

        // Update watch time
        video.watchTime = (video.watchTime || 0) + seconds;

        await video.save();

        return res.json({
            success: true,
            watchTime: video.watchTime
        });

    } catch (err) {
        console.error("ADD WATCH TIME ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to record watch time."
        });
    }
};
            

exports.getTrendingVideos = async (req, res) => {

    try {

        const videos = await
        ShortVideo.find({
            $or: [
                { moderationStatus:
        "approved" },
                 { moderationStatus:
        { $exists: false } }
            ]
        });
        
        videos.sort((a, b) => {

            const scoreA =
                (a.views * 1) +
                (a.likes.length * 5) +
                (a.comments.length * 8) +
                ((a.watchTime || 0) / 60);

            const scoreB =
                (b.views * 1) +
                (b.likes.length * 5) +
                (b.comments.length * 8) +
                ((b.watchTime || 0) / 60);

            return scoreB - scoreA;

        });

        res.json({

            success: true,

            videos: videos.slice(0, 20)

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ================= SHARE VIDEO =================


exports.addShare = async (req, res) => {
    try {
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

        // Find video
        const video = await ShortVideo.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

        // Check moderation status
        if (
            video.moderationStatus &&
            video.moderationStatus !== "approved"
        ) {
            return res.status(403).json({
                success: false,
                message: "This video is not available."
            });
        }

        // Increase share count
        video.shares = (video.shares || 0) + 1;

        await video.save();

        return res.json({
            success: true,
            shares: video.shares
        });

    } catch (err) {
        console.error("ADD SHARE ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to update share count."
        });
    }
};
    

exports.getAnalytics = async (req, res) => {

    try {

        // Get authenticated user's username from JWT
        const username = req.user.username;

        const videos = await ShortVideo.find({ username })
            .select("username avatar caption video views likes comments shares saves createdAt");

        let totalViews = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalShares = 0;
        let totalSaves = 0;
        let totalWatchTime = 0;

        let topVideo = null;
        let topViews = -1;

        videos.forEach(video => {

            totalViews += video.views || 0;
            totalLikes += video.likes?.length || 0;
            totalComments += video.comments?.length || 0;
            totalShares += video.shares || 0;
            totalSaves += video.saves || 0;
            totalWatchTime += video.watchTime || 0;

            if ((video.views || 0) > topViews) {
                topViews = video.views || 0;
                topVideo = video;
            }

        });

        return res.json({

            success: true,

            analytics: {

                totalVideos: videos.length,
                totalViews,
                totalLikes,
                totalComments,
                totalShares,
                totalSaves,
                totalWatchTime,
                topVideo

            }

        });

    } catch (err) {

        console.error("Analytics Error:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to load analytics."
        });

    }

};
                
exports.getAnalyticsChart = async (req, res) => {
    try {
        const username = req.user.username;

        const videos = await ShortVideo.find({
            username
        }).select("views createdAt");

        const chart = [];

        for (let i = 6; i >= 0; i--) {
            const day = new Date();

            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() - i);

            const nextDay = new Date(day);
            nextDay.setDate(nextDay.getDate() + 1);

            let views = 0;

            videos.forEach(video => {
                if (
                    video.createdAt >= day &&
                    video.createdAt < nextDay
                ) {
                    views += video.views || 0;
                }
            });

            chart.push({
                day: day.toLocaleDateString("en-US", {
                    weekday: "short"
                }),
                views
            });
        }

        return res.json({
            success: true,
            chart
        });

    } catch (err) {
        console.error("Analytics Chart Error:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to load analytics chart"
        });
    }
};


exports.getTopVideos = async (req, res) => {

    try {

        const username = req.user.username;

        const videos = await ShortVideo.find({ username })
            .select("username avatar caption video views likes watchTime");

        videos.sort((a, b) => {

            const scoreA =
                (a.views || 0) +
                ((a.likes?.length || 0) * 5) +
                (a.watchTime || 0);

            const scoreB =
                (b.views || 0) +
                ((b.likes?.length || 0) * 5) +
                (b.watchTime || 0);

            return scoreB - scoreA;

        });

        return res.json({

            success: true,

            videos: videos.slice(0, 5)

        });

    } catch (err) {

        console.error("Top Videos Analytics Error:", err);

        return res.status(500).json({

            success: false,

            message: "Failed to load top videos."

        });

    }

};


exports.getFollowersGrowth = async (req, res) => {

    try {

        const username = req.user.username;

        const user = await User.findOne({ username })
            .select("followers");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const totalFollowers = Array.isArray(user.followers)
            ? user.followers.length
            : 0;

        const growth = [];

        for (let i = 6; i >= 0; i--) {

            const date = new Date();

            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - i);

            growth.push({
                day: date.toLocaleDateString("en-US", {
                    weekday: "short"
                }),
                followers: totalFollowers
            });

        }

        return res.json({
            success: true,
            totalFollowers,
            growth
        });

    } catch (err) {

        console.error("Followers Growth Error:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to load followers analytics."
        });

    }

};


exports.getCreatorLevel = async (req, res) => {
    try {
        const username = req.user.username;

        const user = await User.findById(req.user._id)
            .select("followers");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const videos = await ShortVideo.find({ username })
            .select("views likes watchTime");

        let views = 0;
        let likes = 0;
        let watchTime = 0;

        videos.forEach(video => {
            views += Number(video.views) || 0;

            likes += Array.isArray(video.likes)
                ? video.likes.length
                : 0;

            watchTime += Number(video.watchTime) || 0;
        });

        const followers = Array.isArray(user.followers)
            ? user.followers.length
            : 0;

        let level = "🥉 Bronze Creator";
        let next = "🥈 Silver Creator";

        if (
            followers >= 10000 &&
            views >= 1000000 &&
            watchTime >= 360000
        ) {
            level = "💎 Diamond Creator";
            next = "MAX";
        } else if (
            followers >= 1000 &&
            views >= 100000 &&
            watchTime >= 36000
        ) {
            level = "🥇 Gold Creator";
            next = "💎 Diamond Creator";
        } else if (
            followers >= 100 &&
            views >= 10000 &&
            watchTime >= 3600
        ) {
            level = "🥈 Silver Creator";
            next = "🥇 Gold Creator";
        }

        return res.json({
            success: true,
            level,
            next,
            stats: {
                followers,
                views,
                likes,
                watchTime
            }
        });

    } catch (err) {
        console.error("Creator Level Error:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to load creator level."
        });
    }
};

exports.getCreatorBadge = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("username followers creatorBadge");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const videos = await ShortVideo.find({
            username: user.username
        }).select("views watchTime");

        let views = 0;
        let watchTime = 0;

        videos.forEach(video => {
            views += Number(video.views) || 0;
            watchTime += Number(video.watchTime) || 0;
        });

        const followers = Array.isArray(user.followers)
            ? user.followers.length
            : 0;

        let badge = "🥉 Bronze Creator";

        if (
            followers >= 10000 &&
            views >= 1000000 &&
            watchTime >= 360000
        ) {
            badge = "💎 Diamond Creator";
        } else if (
            followers >= 1000 &&
            views >= 100000 &&
            watchTime >= 36000
        ) {
            badge = "🥇 Gold Creator";
        } else if (
            followers >= 100 &&
            views >= 10000 &&
            watchTime >= 3600
        ) {
            badge = "🥈 Silver Creator";
        }

        if (user.creatorBadge !== badge) {
            user.creatorBadge = badge;
            await user.save();
        }

        return res.json({
            success: true,
            badge
        });

    } catch (err) {
        console.error("Creator Badge Error:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to load creator badge."
        });
    }
};

// ================= SEARCH SHORTS =================


exports.searchShorts = async (req, res) => {
    try {
        const keyword = String(req.params.keyword || "").trim();

        if (!keyword || keyword.length < 2 || keyword.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Search keyword must be between 2 and 50 characters."
            });
        }

        // Escape regex special characters
        const safeKeyword = keyword.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        
const videos = await ShortVideo.find({
    $and: [
        {
            $or: [
                {
                    caption: {
                        $regex: safeKeyword,
                        $options: "i"
                    }
                },
                {
                    hashtags: {
                        $in: [keyword.toLowerCase()]
                    }
                },
                {
                    username: {
                        $regex: safeKeyword,
                        $options: "i"
                    }
                }
            ]
        },
        {
            $or: [
                { moderationStatus: "approved" },
                { moderationStatus: { $exists: false } }
            ]
        }
    ]
})

        .select("-__v")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

        return res.json({
            success: true,
            videos
        });

    } catch (err) {
        console.error("Search Shorts Error:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to search videos."
        });
    }
};
                
