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

