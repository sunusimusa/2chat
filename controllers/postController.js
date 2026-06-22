const Post = require("../models/Post");

// CREATE POST

exports.createPost =
async(req,res)=>{

try{

const {userId,username,text}
= req.body;

const post =
await Post.create({
userId,
username,
text
});

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
