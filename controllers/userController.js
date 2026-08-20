const User = require("../models/User");

const Notification =
    require("../models/Notification");


// =====================================================
// FOLLOW / UNFOLLOW USER
// =====================================================

exports.followUser = async (req, res) => {

    try {

        // =================================================
        // CURRENT USER
        // =================================================

        const myUserId =
            req.user._id;


        const targetUsername =
            String(
                req.body.targetUsername || ""
            ).trim();


        // =================================================
        // VALIDATE TARGET
        // =================================================

        if (!targetUsername) {

            return res.status(400).json({

                success: false,

                message:
                    "Target username is required."

            });

        }


        // =================================================
        // FIND CURRENT USER
        // =================================================

        const me =
            await User.findById(
                myUserId
            );


        if (!me) {

            return res.status(404).json({

                success: false,

                message:
                    "Your account was not found."

            });

        }


        // =================================================
        // FIND TARGET USER
        // =================================================

        const target =
            await User.findOne({
                username: targetUsername
            });


        if (!target) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        // =================================================
        // PREVENT SELF FOLLOW
        // =================================================

        if (
            String(me._id) ===
            String(target._id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "You cannot follow yourself."

            });

        }


        // =================================================
        // NORMALIZE ARRAYS
        // =================================================

        if (!Array.isArray(me.following)) {

            me.following = [];

        }


        if (!Array.isArray(target.followers)) {

            target.followers = [];

        }


        // =================================================
        // CHECK CURRENT FOLLOW STATUS
        // =================================================

        const isFollowing =
            me.following.some(
                username =>
                    String(username).toLowerCase() ===
                    String(target.username).toLowerCase()
            );


        // =================================================
        // UNFOLLOW
        // =================================================

        if (isFollowing) {

            me.following =
                me.following.filter(
                    username =>
                        String(username).toLowerCase() !==
                        String(target.username).toLowerCase()
                );


            target.followers =
                target.followers.filter(
                    username =>
                        String(username).toLowerCase() !==
                        String(me.username).toLowerCase()
                );


            await me.save();

            await target.save();


            return res.json({

                success: true,

                action: "unfollow",

                following:
                    me.following.length,

                followers:
                    target.followers.length

            });

        }


        // =================================================
        // FOLLOW
        // =================================================

        me.following.push(
            target.username
        );


        target.followers.push(
            me.username
        );


        await me.save();

        await target.save();


        // =================================================
        // NOTIFICATION
        // =================================================

        try {

            await Notification.create({

                receiver:
                    target.username,

                sender:
                    me.username,

                type:
                    "follow",

                text:
                    me.username +
                    " started following you 👤"

            });

        } catch (notificationError) {

            console.error(
                "FOLLOW NOTIFICATION ERROR:",
                notificationError
            );

            // Follow operation ya riga ya yi nasara.
            // Notification error ba zai karya Follow ba.
        }


        // =================================================
        // RESPONSE
        // =================================================

        return res.json({

            success: true,

            action: "follow",

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


// =====================================================
// GET USER PROFILE
// =====================================================

exports.getUserProfile = async (req, res) => {

    try {

        const username =
            String(
                req.params.username || ""
            ).trim();


        if (!username) {

            return res.status(400).json({

                success: false,

                message:
                    "Username is required."

            });

        }


        const user =
            await User.findOne({
                username
            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

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


// =====================================================
// GET ALL USERS
// =====================================================

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


// =====================================================
// SEARCH USERS
// =====================================================

exports.searchUsers = async (req, res) => {

    try {

        const keyword =
            String(
                req.params.keyword || ""
            ).trim();


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
