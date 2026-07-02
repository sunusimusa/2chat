const User = require("../models/User");

// FOLLOW / UNFOLLOW USER

exports.followUser = async (req,res)=>{

try{

const {
myUsername,
targetUsername
} = req.body;

if(myUsername === targetUsername){

return res.json({
success:false,
message:"You cannot follow yourself."
});

}

const me = await User.findOne({
username:myUsername
});

const target = await User.findOne({
username:targetUsername
});

if(!me || !target){

return res.json({
success:false,
message:"User not found."
});

}

if(me.following.includes(targetUsername)){

me.following =
me.following.filter(
u => u !== targetUsername
);

target.followers =
target.followers.filter(
u => u !== myUsername
);

}else{

me.following.push(targetUsername);

target.followers.push(myUsername);

}

await me.save();
await target.save();

res.json({
success:true,
following:me.following.length,
followers:target.followers.length
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};
