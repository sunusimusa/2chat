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

        
            let tags = [];

if(req.body.hashtags){

    tags = req.body.hashtags
    .split(" ")
    .map(tag =>
        tag.replace("#","").toLowerCase()
    )
    .filter(tag=>tag);

}


const short = await ShortVideo.create({

    username: req.body.username,

    avatar: req.body.avatar || "",

    caption: req.body.caption || "",

    category: req.body.category || "general",

    hashtags: tags,

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
                success: false,
                message: "User not found"
            });
        }

        const video = await ShortVideo.findById(videoId);

        console.log("VIDEO:", video);

        if (!video) {
            return res.json({
                success: false,
                message: "Video not found"
            });
        }

        console.log("Before Save:", user.savedVideos);

        const alreadySaved = user.savedVideos.some(
            id => id.toString() === videoId
        );

        if (alreadySaved) {

            // UNSAVE
            user.savedVideos = user.savedVideos.filter(
                id => id.toString() !== videoId
            );

            if (video.saves > 0) {
                video.saves--;
            }

            await user.save();
            await video.save();

            console.log("After Unsave:", user.savedVideos);

            return res.json({
                success: true,
                saved: false,
                saves: video.saves
            });

        } else {

            // SAVE
            user.savedVideos.push(video._id);

            video.saves++;

            await user.save();
            await video.save();

            console.log("After Save:", user.savedVideos);

            return res.json({
                success: true,
                saved: true,
                saves: video.saves
            });

        }

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
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

    let scoreA = favoriteCategories[a.category] || 0;
    let scoreB = favoriteCategories[b.category] || 0;

    // Ƙara maki daga Watch Time
    scoreA += (a.watchTime || 0) / 100;
    scoreB += (b.watchTime || 0) / 100;

    // Ƙara maki daga Likes
    scoreA += a.likes.length;
    scoreB += b.likes.length;

    // Ƙara maki daga Comments
    scoreA += a.comments.length * 2;
    scoreB += b.comments.length * 2;

    // Ƙara maki daga Views
    scoreA += a.views / 10;
    scoreB += b.views / 10;

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

exports.addWatchTime = async (req, res) => {

    try {

        const { seconds } = req.body;

        const video = await ShortVideo.findById(req.params.id);

        if (!video) {
            return res.json({
                success: false,
                message: "Video not found"
            });
        }

        video.watchTime += Number(seconds);

        await video.save();

        res.json({
            success: true,
            watchTime: video.watchTime
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
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
