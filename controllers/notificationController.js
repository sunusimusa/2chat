const Notification =
require("../models/Notification");

exports.getNotifications =
async(req,res)=>{

try{

const notifications =
await Notification.find({
    receiver: req.user.username
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

  if (!req.body.id) {
    return res.status(400).json({
        success: false,
        message: "Notification ID is required."
    });
  }

const notification = await Notification.findOneAndUpdate(
    {
        _id: req.body.id,
        receiver: req.user.username
    },
    {
        read: true
    },
    {
        new: true
    }
);

if (!notification) {
    return res.status(404).json({
        success: false,
        message: "Notification not found."
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

exports.getUnreadCount = async(req,res)=>{

try{

const count =
await Notification.countDocuments({

    receiver: req.user.username,

    read: false

});
  
res.json({

success:true,

count

});

}catch(err){

res.status(500).json({

success:false,

message:err.message

});

}

};
