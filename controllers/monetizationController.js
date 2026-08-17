const User = require("../models/User");
const ShortVideo = require("../models/ShortVideo");
const Monetization = require("../models/Monetization");


// =====================================================
// MONETIZATION RULES
// =====================================================

const MONETIZATION_RULES = {

    minimumAccountAgeDays: 30,

    minimumFollowers: 100,

    minimumViews: 10000,

    minimumWatchTime: 3600,

    minimumEarnings: 5000

};


// =====================================================
// GET MONETIZATION STATUS
// GET /api/monetization/status
// =====================================================

exports.getMonetizationStatus = async (req, res) => {

    try {

        // =========================================
        // GET LOGGED-IN USER
        // =========================================

        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found"

            });

        }


        // =========================================
        // ACCOUNT AGE
        // =========================================

        const createdAt = new Date(user.createdAt);

        const now = new Date();

        const accountAgeDays = Math.floor(
            (
                now.getTime() -
                createdAt.getTime()
            ) /
            (1000 * 60 * 60 * 24)
        );


        // =========================================
        // CREATOR VIDEOS
        // =========================================

        const videos = await ShortVideo.find({

            username: user.username

        });


        // =========================================
        // CALCULATE CREATOR STATS
        // =========================================

        let totalViews = 0;

        let totalWatchTime = 0;

        let totalLikes = 0;

        let totalComments = 0;

        let totalShares = 0;

        let totalSaves = 0;


        videos.forEach(video => {

            totalViews += video.views || 0;

            totalWatchTime +=
                video.watchTime || 0;

            totalLikes +=
                video.likes?.length || 0;

            totalComments +=
                video.comments?.length || 0;

            totalShares +=
                video.shares || 0;

            totalSaves +=
                video.saves || 0;

        });


        // =========================================
        // FIND MONETIZATION RECORD
        // =========================================

        let monetization =
            await Monetization.findOne({

                userId

            });


        // =========================================
        // CREATE RECORD IF NOT EXISTS
        // =========================================

        if (!monetization) {

            monetization =
                await Monetization.create({

                    userId,

                    status: "not_eligible",

                    totalEarned: 0,

                    availableEarnings: 0,

                    withdrawnAmount: 0,

                    monetizedViews: 0,

                    monetizedVideos: 0

                });

        }


        // =========================================
        // CURRENT EARNINGS
        // =========================================

        const totalEarned =
            monetization.totalEarned || 0;


        // =========================================
        // CHECK REQUIREMENTS
        // =========================================

        const requirements = {

            accountAge: {

                required:
                    MONETIZATION_RULES
                        .minimumAccountAgeDays,

                current:
                    accountAgeDays,

                met:
                    accountAgeDays >=
                    MONETIZATION_RULES
                        .minimumAccountAgeDays

            },


            followers: {

                required:
                    MONETIZATION_RULES
                        .minimumFollowers,

                current:
                    user.followers?.length || 0,

                met:
                    (
                        user.followers?.length || 0
                    ) >=
                    MONETIZATION_RULES
                        .minimumFollowers

            },


            views: {

                required:
                    MONETIZATION_RULES
                        .minimumViews,

                current:
                    totalViews,

                met:
                    totalViews >=
                    MONETIZATION_RULES
                        .minimumViews

            },


            watchTime: {

                required:
                    MONETIZATION_RULES
                        .minimumWatchTime,

                current:
                    totalWatchTime,

                met:
                    totalWatchTime >=
                    MONETIZATION_RULES
                        .minimumWatchTime

            },


            earnings: {

                required:
                    MONETIZATION_RULES
                        .minimumEarnings,

                current:
                    totalEarned,

                met:
                    totalEarned >=
                    MONETIZATION_RULES
                        .minimumEarnings

            }

        };


        // =========================================
        // CHECK ALL REQUIREMENTS
        // =========================================

        const eligible =
            Object.values(requirements)
                .every(requirement =>
                    requirement.met
                );


        // =========================================
        // UPDATE STATUS
        // =========================================

        if (monetization.status !== "active") {

            monetization.status =
                eligible
                    ? "eligible"
                    : "not_eligible";

        }


        await monetization.save();


        // =========================================
        // RESPONSE
        // =========================================

        return res.json({

            success: true,

            monetization: {

                eligible,

                status:
                    monetization.status,

                rules:
                    MONETIZATION_RULES,

                requirements,

                stats: {

                    username:
                        user.username,

                    followers:
                        user.followers?.length || 0,

                    videos:
                        videos.length,

                    views:
                        totalViews,

                    likes:
                        totalLikes,

                    comments:
                        totalComments,

                    shares:
                        totalShares,

                    saves:
                        totalSaves,

                    watchTime:
                        totalWatchTime,

                    totalEarned,

                    availableBalance:
                        monetization.availableEarnings || 0,

                    accountAgeDays

                }

            }

        });


    } catch (error) {

        console.error(
            "MONETIZATION STATUS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to check monetization status"

        });

    }

};
