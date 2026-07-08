const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");

// SEND FRIEND REQUEST
exports.sendRequest = async (req, res) => {

try {

const { sender, receiver } = req.body;

if (sender === receiver) {
return res.json({
success:false,
message:"You cannot add yourself."
});
}

const exists = await FriendRequest.findOne({
sender,
receiver
});

if (exists) {
return res.json({
success:false,
message:"Friend request already sent."
});
}

const request = await FriendRequest.create({
sender,
receiver
});

res.json({
success:true,
request
});

} catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// ACCEPT FRIEND REQUEST
exports.acceptRequest = async (req,res)=>{

try{

const { requestId } = req.body;

const request = await FriendRequest.findById(requestId);

if(!request){

return res.json({
success:false,
message:"Request not found."
});

}

request.status = "accepted";

await request.save();

await User.updateOne(
{ username: request.sender },
{ $addToSet: { friends: request.receiver } }
);

await User.updateOne(
{ username: request.receiver },
{ $addToSet: { friends: request.sender } }
);

res.json({
success:true,
message:"Friend request accepted."
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// REJECT FRIEND REQUEST
exports.rejectRequest = async (req,res)=>{

try{

const { requestId } = req.body;

await FriendRequest.findByIdAndDelete(requestId);

res.json({
success:true,
message:"Friend request rejected."
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// GET REQUESTS
exports.getRequests = async (req,res)=>{

try{

const requests = await FriendRequest.find({
receiver:req.params.username,
status:"pending"
}).sort({createdAt:-1});

res.json({
success:true,
requests
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// GET FRIENDS
exports.getFriends = async (req,res)=>{

try{

const user = await User.findOne({
username:req.params.username
});

res.json({
success:true,
friends:user ? user.friends : []
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};
