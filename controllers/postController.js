const Post = require("../models/Post");
const cloudinary = require("../config/cloudinary");

const Notification =
require("../models/Notification");

// CREATE POST


exports.createPost = async (req, res) => {
    try {

        const userId = req.user._id;
        const username = req.user.username;
        const avatar = req.user.avatar;
        const { text } = req.body;

        let image = "";
        let video = "";

        if (req.file) {

            const isImage =
                req.file.mimetype.startsWith("image/");

            const isVideo =
                req.file.mimetype.startsWith("video/");

            if (!isImage && !isVideo) {
                return res.status(400).json({
                    success: false,
                    message: "Only image and video files are allowed."
                });
            }

            const result = await new Promise((resolve, reject) => {

                const stream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: isImage ? "image" : "video",
                        folder: isImage ? "2chat-images" : "2chat-videos"
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                stream.end(req.file.buffer);

            });

            if (isImage) {
                image = result.secure_url;
            } else {
                video = result.secure_url;
            }
        }

        const post = await Post.create({
            userId,
            username,
            avatar,
            text,
            image,
            video
        });

        return res.json({
            success: true,
            post
        });

    } catch (err) {

        console.error("CREATE POST ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to create post."
        });
    }
};


// GET POSTS

exports.getPosts =
async(req,res)=>{

try{

const posts =
await Post.find()
.sort({createdAt:-1});

res.json({
success:true,
posts
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// LIKE POST

exports.likePost = async (req,res)=>{

try{

const { postId, username } = req.body;

const post =
await Post.findById(postId);

if(!post){

return res.status(404).json({
success:false,
message:"Post not found"
});

}

if(post.likes.includes(username)){

post.likes =
post.likes.filter(
u => u !== username
);

}else{

post.likes.push(username);

  
if(post.username !== username){

await Notification.create({

receiver:post.username,

sender:username,

type:"like",

postId:post._id,

text:username + " liked your post ❤️"

});

}

}

await post.save();

res.json({
success:true,
likes:post.likes.length
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// COMMENT POST

exports.commentPost = async (req,res)=>{

try{

const {
postId,
username,
text
} = req.body;

const post =
await Post.findById(postId);

if(!post){

return res.status(404).json({
success:false,
message:"Post not found"
});

}

if(!post.comments){
  post.comments = [];
}

post.comments.push({
  username,
  text
});

await post.save();

if(post.username !== username){

await Notification.create({

receiver:post.username,

sender:username,

type:"comment",

postId:post._id,

text:username + " commented on your post 💬"

});

}  

res.json({
success:true
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// DELETE POST

exports.deletePost = async (req,res)=>{

try{

const { postId } = req.body;

const post =
await Post.findById(postId);

if(!post){

return res.status(404).json({
success:false,
message:"Post not found"
});

}

await Post.findByIdAndDelete(postId);

res.json({
success:true,
message:"Post deleted"
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// EDIT POST

exports.editPost = async (req,res)=>{

try{

const { postId, text } = req.body;

const post =
await Post.findById(postId);

if(!post){

return res.status(404).json({
success:false,
message:"Post not found"
});

}

post.text = text;

await post.save();

res.json({
success:true,
post
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// GET MY POSTS

exports.getUserPosts = async (req,res)=>{

try{

const { username } = req.params;

const posts = await Post.find({
username
}).sort({
createdAt:-1
});

res.json({
success:true,
count:posts.length,
posts
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

exports.getSinglePost = async (req,res)=>{

try{

const post =
await Post.findById(req.params.id);

if(!post){

return res.json({
success:false,
message:"Post not found"
});

}

res.json({
success:true,
post
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};
