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

// =========================================
// GET NOTIFICATION SETTINGS
// =========================================

exports.getNotificationSettings = async (req, res) => {
    try {
        const User = require("../models/User");

        const user = await User.findById(req.user._id)
            .select("notificationsEnabled");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.json({
            success: true,
            notificationsEnabled:
                user.notificationsEnabled !== false
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// =========================================
// UPDATE NOTIFICATION SETTINGS
// =========================================

exports.updateNotificationSettings = async (req, res) => {
    try {
        const User = require("../models/User");

        const { enabled } = req.body;

        if (typeof enabled !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Enabled must be true or false."
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    notificationsEnabled: enabled
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).select("notificationsEnabled");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.json({
            success: true,
            notificationsEnabled: user.notificationsEnabled,
            message: enabled
                ? "Notifications enabled successfully."
                : "Notifications disabled successfully."
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
