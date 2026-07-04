const Notification =
require("../models/Notification");

exports.getNotifications =
async(req,res)=>{

try{

const notifications =
await Notification.find({
receiver:req.params.username
})
.sort({createdAt:-1});

res.json({
success:true,
notifications
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

exports.readNotification =
async(req,res)=>{

try{

await Notification.findByIdAndUpdate(
req.body.id,
{
read:true
}
);

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
