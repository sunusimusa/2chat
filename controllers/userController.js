const User = require("../models/User");

const Monetization =
require("../models/Monetization");

const Notification =
require("../models/Notification");


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

await Notification.create({

receiver:targetUsername,

sender:myUsername,

type:"follow",

text:myUsername + " started following you 👤"

});  

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

// GET USER PROFILE

exports.getUserProfile = async (req,res)=>{

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

res.json({
success:true,
user
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

exports.getAllUsers = async (req, res) => {
try {

const users = await User.find(
{},
"username avatar online lastSeen"
).sort({ username: 1 });

res.json({
success: true,
users
});

} catch (err) {

res.status(500).json({
success: false,
message: err.message
});

}
};

// ==========================
// SEARCH USERS
// ==========================

exports.searchUsers = async (req, res) => {

    try {

        const keyword =
            req.params.keyword
                .trim();

        if (!keyword) {

            return res.json({
                success: true,
                users: []
            });

        }


        const users =
            await User.find(
                {
                    username: {
                        $regex: keyword,
                        $options: "i"
                    }
                },
                "username avatar online lastSeen bio"
            )
            .sort({
                username: 1
            })
            .limit(30);


        return res.json({

            success: true,

            users

        });


    } catch (err) {

        console.error(
            "SEARCH USERS ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to search users."

        });

    }

};
