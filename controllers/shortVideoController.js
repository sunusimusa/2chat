const ShortVideo = require("../models/ShortVideo");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");


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

        if (
            typeof videoId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(videoId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid video ID."
            });
        }

        const video = await ShortVideo.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

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

        if (
            typeof videoId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(videoId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid video ID."
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const video = await ShortVideo.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
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

            video.saves = Math.max(0, (video.saves || 0) - 1);

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
                model: "ShortVideo"
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.json({
            success: true,
            videos: user.savedVideos || []
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

        let videos = await ShortVideo.find()
            .sort({ createdAt: -1 });

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
            _id: { $in: user.savedVideos || [] }
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

        if (
            typeof videoId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(videoId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid video ID."
            });
        }

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

        const video = await ShortVideo.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

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

        const videos = await ShortVideo.find();

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

        const video = await ShortVideo.findById(req.params.id);

        if (!video) {
            return res.json({
                success: false,
                message: "Video not found"
            });
        }

        video.shares += 1;

        await video.save();

        res.json({
            success: true,
            shares: video.shares
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.getAnalytics = async (req, res) => {

    try{

        const username = req.params.username;

        const videos = await ShortVideo.find({ username });

        let totalViews = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalShares = 0;
        let totalSaves = 0;
        let totalWatchTime = 0;

        let topVideo = null;
        let topViews = 0;

        videos.forEach(video => {

            totalViews += video.views || 0;
            totalLikes += video.likes.length;
            totalComments += video.comments.length;
            totalShares += video.shares || 0;
            totalSaves += video.saves || 0;
            totalWatchTime += video.watchTime || 0;

            if(video.views > topViews){

                topViews = video.views;
                topVideo = video;

            }

        });

        res.json({

            success:true,

            analytics:{

                totalVideos:videos.length,

                totalViews,

                totalLikes,

                totalComments,

                totalShares,

                totalSaves,

                totalWatchTime,

                topVideo

            }

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

exports.getAnalyticsChart = async (req, res) => {

    try{

        const username = req.params.username;

        const videos = await ShortVideo.find({
            username
        });

        const chart = [];

        for(let i = 6; i >= 0; i--){

            const day = new Date();

            day.setHours(0,0,0,0);

            day.setDate(day.getDate() - i);

            const nextDay = new Date(day);

            nextDay.setDate(nextDay.getDate() + 1);

            let views = 0;

            videos.forEach(video=>{

                if(
                    video.createdAt >= day &&
                    video.createdAt < nextDay
                ){

                    views += video.views;

                }

            });

            chart.push({

                day: day.toLocaleDateString("en-US",{
                    weekday:"short"
                }),

                views

            });

        }

        res.json({

            success:true,

            chart

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

exports.getTopVideos = async (req,res)=>{

    try{

        const username = req.params.username;


        let videos = await ShortVideo.find({
            username
        });


        videos.sort((a,b)=>{


            const scoreA =
                (a.views || 0) +
                (a.likes.length * 5) +
                (a.watchTime || 0);


            const scoreB =
                (b.views || 0) +
                (b.likes.length * 5) +
                (b.watchTime || 0);


            return scoreB - scoreA;


        });


        res.json({

            success:true,

            videos: videos.slice(0,5)

        });


    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

exports.getFollowersGrowth = async (req,res)=>{

    try{

        const username = req.params.username;


        const user = await User.findOne({
            username
        });


        if(!user){

            return res.json({

                success:false,

                message:"User not found"

            });

        }


        const growth = [];


        for(let i = 6; i >= 0; i--){

            const date = new Date();

            date.setHours(0,0,0,0);

            date.setDate(
                date.getDate() - i
            );


            // A yanzu muna amfani da followers count
            // daga User document

            growth.push({

                day: date.toLocaleDateString(
                    "en-US",
                    {
                        weekday:"short"
                    }
                ),

                followers:user.followers.length

            });

        }


        res.json({

            success:true,

            totalFollowers:user.followers.length,

            growth

        });


    }catch(err){


        res.status(500).json({

            success:false,

            message:err.message

        });


    }

};

exports.getCreatorLevel = async (req,res)=>{

    try{

        const username = req.params.username;


        const user = await User.findOne({
            username
        });


        if(!user){

            return res.json({
                success:false,
                message:"User not found"
            });

        }


        const videos = await ShortVideo.find({
            username
        });



        let views = 0;
        let likes = 0;
        let watchTime = 0;



        videos.forEach(video=>{

            views += video.views;

            likes += video.likes.length;

            watchTime += video.watchTime || 0;

        });



        const followers =
        user.followers.length;



        let level = "🥉 Bronze Creator";


        let next = "🥈 Silver Creator";


        if(
            followers >= 1000 &&
            views >= 100000 &&
            watchTime >= 36000
        ){

            level = "🥇 Gold Creator";
            next = "💎 Diamond Creator";

        }


        if(
            followers >= 10000 &&
            views >= 1000000 &&
            watchTime >= 360000
        ){

            level = "💎 Diamond Creator";
            next = "MAX";

        }


        else if(
            followers >= 100 &&
            views >= 10000 &&
            watchTime >= 3600
        ){

            level = "🥈 Silver Creator";
            next = "🥇 Gold Creator";

        }



        res.json({

            success:true,

            level,

            next,

            stats:{
                followers,
                views,
                likes,
                watchTime
            }

        });



    }catch(err){

        res.status(500).json({

            success:false,
            message:err.message

        });

    }

};

exports.getCreatorBadge = async(req,res)=>{

try{

const username = req.params.username;


const user = await User.findOne({
    username
});


if(!user){

return res.json({
success:false,
message:"User not found"
});

}



const videos = await ShortVideo.find({
username
});


let views = 0;
let watchTime = 0;


videos.forEach(video=>{

views += video.views;

watchTime += video.watchTime || 0;

});


const followers = user.followers.length;



let badge = "🥉 Bronze Creator";



if(
followers >= 10000 &&
views >= 1000000 &&
watchTime >= 360000
){

badge = "💎 Diamond Creator";

}

else if(
followers >= 1000 &&
views >= 100000 &&
watchTime >= 36000
){

badge = "🥇 Gold Creator";

}

else if(
followers >= 100 &&
views >= 10000 &&
watchTime >= 3600
){

badge = "🥈 Silver Creator";

}



user.creatorBadge = badge;

await user.save();



res.json({

success:true,

badge

});


}catch(err){

res.status(500).json({

success:false,

message:err.message

});

}

};

// ================= SEARCH SHORTS =================

exports.searchShorts = async(req,res)=>{

try{

const keyword =
req.params.keyword.toLowerCase();


const videos = await ShortVideo.find({

$or:[

{
caption:{
$regex:keyword,
$options:"i"
}
},

{
hashtags:{
$in:[keyword]
}
},

{
username:{
$regex:keyword,
$options:"i"
}
}

]

})
.sort({
createdAt:-1
});


res.json({

success:true,

videos

});


}catch(err){

res.status(500).json({

success:false,

message:err.message

});

}

};
