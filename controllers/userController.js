const User = require("../models/User");

const Notification =
    require("../models/Notification");


// =========================================
// FOLLOW / UNFOLLOW USER
// =========================================

exports.followUser = async (req, res) => {

    try {

        const {
            myUsername,
            targetUsername
        } = req.body;


        if (!myUsername || !targetUsername) {

            return res.json({
                success: false,
                message: "Username is required."
            });

        }


        if (
            String(myUsername).toLowerCase() ===
            String(targetUsername).toLowerCase()
        ) {

            return res.json({
                success: false,
                message: "You cannot follow yourself."
            });

        }


        const me = await User.findOne({
            username: myUsername
        });


        const target = await User.findOne({
            username: targetUsername
        });


        if (!me || !target) {

            return res.json({
                success: false,
                message: "User not found."
            });

        }


        // =========================================
        // UNFOLLOW
        // =========================================

        if (me.following.includes(targetUsername)) {

            me.following =
                me.following.filter(
                    username =>
                        username !== targetUsername
                );


            target.followers =
                target.followers.filter(
                    username =>
                        username !== myUsername
                );

        }


        // =========================================
        // FOLLOW
        // =========================================

        else {

            if (!me.following.includes(targetUsername)) {

                me.following.push(
                    targetUsername
                );

            }


            if (!target.followers.includes(myUsername)) {

                target.followers.push(
                    myUsername
                );

            }


            await Notification.create({

                receiver:
                    targetUsername,

                sender:
                    myUsername,

                type:
                    "follow",

                text:
                    myUsername +
                    " started following you 👤"

            });

        }


        await me.save();
        await target.save();


        return res.json({

            success: true,

            following:
                me.following.length,

            followers:
                target.followers.length

        });


    } catch (err) {

        console.error(
            "FOLLOW USER ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to update follow status."

        });

    }

};


// =========================================
// GET USER PROFILE
// =========================================

exports.getUserProfile = async (req, res) => {

    try {

        const username =
            req.params.username;


        const user =
            await User.findOne({
                username
            });


        if (!user) {

            return res.json({

                success: false,

                message:
                    "User not found"

            });

        }


        return res.json({

            success: true,

            user

        });


    } catch (err) {

        console.error(
            "GET USER PROFILE ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load user profile."

        });

    }

};


// =========================================
// GET ALL USERS
// =========================================

exports.getAllUsers = async (req, res) => {

    try {

        const users =
            await User.find(
                {},
                "username avatar online lastSeen"
            )
            .sort({
                username: 1
            });


        return res.json({

            success: true,

            users

        });


    } catch (err) {

        console.error(
            "GET ALL USERS ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load users."

        });

    }

};


// =========================================
// SEARCH USERS
// =========================================

exports.searchUsers = async (req, res) => {

    try {

        const keyword =
            (req.params.keyword || "")
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
