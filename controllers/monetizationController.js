const User = require("../models/User");
const ShortVideo = require("../models/ShortVideo");
const Wallet = require("../models/Wallet");


// =========================================
// 2CHAT CREATOR MONETIZATION RULES
// =========================================
//
// NOTE:
// Wannan shi ne central place na rules.
// Idan daga baya muna son canza numbers,
// sai mu canza a nan kawai.
//
// =========================================

const MONETIZATION_RULES = {

    // Minimum account age
    minimumAccountAgeDays: 30,

    // Minimum followers
    minimumFollowers: 100,

    // Minimum total views
    minimumViews: 10000,

    // Minimum watch time
    // 3,600 seconds = 1 hour
    minimumWatchTime: 3600,

    // Minimum creator earnings
    minimumEarnings: 5000

};


// =========================================
// GET CREATOR MONETIZATION STATUS
// =========================================

exports.getMonetizationStatus = async (req, res) => {

    try {

        const userId =
            req.user._id;


        // =====================================
        // GET USER
        // =====================================

        const user =
            await User.findById(userId);


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found"

            });

        }


        // =====================================
        // CREATOR VIDEOS
        // =====================================

        const videos =
            await ShortVideo.find({
                username:
                    user.username
            });


        // =====================================
        // CALCULATE CREATOR STATS
        // =====================================

        let totalViews = 0;

        let totalLikes = 0;

        let totalComments = 0;

        let totalShares = 0;

        let totalSaves = 0;

        let totalWatchTime = 0;


        videos.forEach(video => {

            totalViews +=
                Number(video.views || 0);

            totalLikes +=
                Number(
                    video.likes?.length || 0
                );

            totalComments +=
                Number(
                    video.comments?.length || 0
                );

            totalShares +=
                Number(video.shares || 0);

            totalSaves +=
                Number(video.saves || 0);

            totalWatchTime +=
                Number(video.watchTime || 0);

        });


        // =====================================
        // FOLLOWERS
        // =====================================

        const followers =
            Number(
                user.followers?.length || 0
            );


        // =====================================
        // ACCOUNT AGE
        // =====================================

        const createdAt =
            user.createdAt
                ? new Date(user.createdAt)
                : new Date();


        const now =
            new Date();


        const accountAgeDays =
            Math.floor(
                (
                    now.getTime() -
                    createdAt.getTime()
                ) /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        // =====================================
        // WALLET / EARNINGS
        // =====================================

        const wallet =
            await Wallet.findOne({
                userId
            });


        const totalEarned =
            Number(
                wallet?.totalEarned || 0
            );


        const availableBalance =
            Number(
                wallet?.availableBalance || 0
            );


        // =====================================
        // REQUIREMENT CHECKS
        // =====================================

        const accountAgeMet =
            accountAgeDays >=
            MONETIZATION_RULES.minimumAccountAgeDays;


        const followersMet =
            followers >=
            MONETIZATION_RULES.minimumFollowers;


        const viewsMet =
            totalViews >=
            MONETIZATION_RULES.minimumViews;


        const watchTimeMet =
            totalWatchTime >=
            MONETIZATION_RULES.minimumWatchTime;


        const earningsMet =
            totalEarned >=
            MONETIZATION_RULES.minimumEarnings;


        // =====================================
        // FINAL ELIGIBILITY
        // =====================================

        const eligible =
            accountAgeMet &&
            followersMet &&
            viewsMet &&
            watchTimeMet &&
            earningsMet;


        // =====================================
        // REQUIREMENTS RESPONSE
        // =====================================

        const requirements = {

            accountAge: {

                required:
                    MONETIZATION_RULES
                        .minimumAccountAgeDays,

                current:
                    accountAgeDays,

                met:
                    accountAgeMet

            },


            followers: {

                required:
                    MONETIZATION_RULES
                        .minimumFollowers,

                current:
                    followers,

                met:
                    followersMet

            },


            views: {

                required:
                    MONETIZATION_RULES
                        .minimumViews,

                current:
                    totalViews,

                met:
                    viewsMet

            },


            watchTime: {

                required:
                    MONETIZATION_RULES
                        .minimumWatchTime,

                current:
                    totalWatchTime,

                met:
                    watchTimeMet

            },


            earnings: {

                required:
                    MONETIZATION_RULES
                        .minimumEarnings,

                current:
                    totalEarned,

                met:
                    earningsMet

            }

        };


        // =====================================
        // CREATOR STATS
        // =====================================

        const stats = {

            username:
                user.username,

            followers,

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

            availableBalance,

            accountAgeDays

        };


        // =====================================
        // RESPONSE
        // =====================================

        return res.json({

            success: true,

            monetization: {

                eligible,

                status:
                    eligible
                        ? "eligible"
                        : "not_eligible",

                rules:
                    MONETIZATION_RULES,

                requirements,

                stats

            }

        });


    } catch (err) {

        console.error(
            "GET MONETIZATION STATUS ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message ||
                "Failed to check monetization status"

        });

    }

};
