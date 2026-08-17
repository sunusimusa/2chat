const User = require("../models/User");
const ShortVideo = require("../models/ShortVideo");
const Wallet = require("../models/Wallet");
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


// =========================================
// MONETIZATION STATUS
// =========================================

exports.getMonetizationStatus = async (req, res) => {

    try {

        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // =========================================
        // REQUIREMENTS
        // =========================================

        const minimumAccountAgeDays = 30;
        const minimumFollowers = 100;
        const minimumViews = 10000;
        const minimumWatchTime = 3600;
        const minimumEarnings = 5000;


        // =========================================
        // ACCOUNT AGE
        // =========================================

        const now = new Date();

        const accountAgeDays = Math.floor(
            (now - user.createdAt) /
            (1000 * 60 * 60 * 24)
        );


        // =========================================
        // CREATOR VIDEOS
        // =========================================

        const videos = await ShortVideo.find({
            username: user.username
        });


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
        // WALLET
        // IMPORTANT:
        // Earnings da balance suna fitowa
        // daga Wallet, ba Monetization ba.
        // =========================================

        const wallet = await Wallet.findOne({
            userId: user._id
        });


        const totalEarned =
            wallet?.totalEarned || 0;

        const availableBalance =
            wallet?.availableBalance || 0;


        // =========================================
        // CURRENT REQUIREMENTS
        // =========================================

        const requirements = {

            accountAge: {

                required:
                    minimumAccountAgeDays,

                current:
                    accountAgeDays,

                met:
                    accountAgeDays >=
                    minimumAccountAgeDays

            },


            followers: {

                required:
                    minimumFollowers,

                current:
                    user.followers?.length || 0,

                met:
                    (user.followers?.length || 0) >=
                    minimumFollowers

            },


            views: {

                required:
                    minimumViews,

                current:
                    totalViews,

                met:
                    totalViews >=
                    minimumViews

            },


            watchTime: {

                required:
                    minimumWatchTime,

                current:
                    totalWatchTime,

                met:
                    totalWatchTime >=
                    minimumWatchTime

            },


            earnings: {

                required:
                    minimumEarnings,

                current:
                    totalEarned,

                met:
                    totalEarned >=
                    minimumEarnings

            }

        };


        // =========================================
        // CHECK IF ALL REQUIREMENTS ARE MET
        // =========================================

        const allRequirementsMet =
            requirements.accountAge.met &&
            requirements.followers.met &&
            requirements.views.met &&
            requirements.watchTime.met &&
            requirements.earnings.met;


        // =========================================
        // GET / CREATE MONETIZATION RECORD
        // =========================================

        let monetization =
            await Monetization.findOne({
                userId: user._id
            });


        if (!monetization) {

            monetization =
                new Monetization({

                    userId: user._id,

                    eligible: false,

                    eligibleAt: null,

                    status: "not_eligible"

                });

        }


        // =========================================
        // GRANDFATHER ELIGIBILITY
        // =========================================

        if (!monetization.eligible) {

            if (allRequirementsMet) {

                monetization.eligible = true;

                monetization.eligibleAt =
                    monetization.eligibleAt ||
                    new Date();

                monetization.status =
                    "eligible";


                // Save stats at the moment
                // creator becomes eligible.

                monetization.eligibilitySnapshot = {

                    followers:
                        user.followers?.length || 0,

                    views:
                        totalViews,

                    watchTime:
                        totalWatchTime,

                    earnings:
                        totalEarned,

                    accountAgeDays:
                        accountAgeDays

                };


            } else {

                monetization.eligible =
                    false;

                // Kada mu taba pending,
                // approved, etc. idan an riga
                // an fara wani flow.

                if (
                    monetization.status ===
                    "not_eligible"
                ) {

                    monetization.status =
                        "not_eligible";

                }

            }

        }


        // =========================================
        // SAVE MONETIZATION
        // =========================================

        await monetization.save();


        // =========================================
        // RESPONSE
        // =========================================

        res.json({

            success: true,

            monetization: {

                eligible:
                    monetization.eligible,

                eligibleAt:
                    monetization.eligibleAt,

                status:
                    monetization.status,

                rules: {

                    minimumAccountAgeDays,

                    minimumFollowers,

                    minimumViews,

                    minimumWatchTime,

                    minimumEarnings

                },

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

                    availableBalance,

                    accountAgeDays

                }

            }

        });


    } catch (err) {

        console.error(
            "MONETIZATION STATUS ERROR:",
            err
        );

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

        
     exports.applyForMonetization = async (req, res) => {

    try {

        const userId = req.user._id;


        // =========================================
        // FIND MONETIZATION RECORD
        // =========================================

        const monetization =
            await Monetization.findOne({
                userId
            });


        if (!monetization) {

            return res.status(404).json({

                success: false,

                message:
                    "Monetization record not found. Check eligibility first."

            });

        }


        // =========================================
        // MUST BE ELIGIBLE
        // =========================================

        if (!monetization.eligible) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not eligible for monetization yet."

            });

        }


        // =========================================
        // PREVENT DUPLICATE APPLICATION
        // =========================================

        if (
            monetization.status ===
            "pending"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Your monetization application is already pending."

            });

        }


        // =========================================
        // ALREADY APPROVED
        // =========================================

        if (
            monetization.status ===
            "approved"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Your monetization account is already approved."

            });

        }


        // =========================================
        // SUSPENDED
        // =========================================

        if (
            monetization.status ===
            "suspended"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your monetization account is currently suspended."

            });

        }


        // =========================================
        // APPLY
        // =========================================

        monetization.status =
            "pending";

        monetization.appliedAt =
            new Date();

        monetization.reviewedAt =
            null;

        monetization.rejectionReason =
            null;


        await monetization.save();


        // =========================================
        // RESPONSE
        // =========================================

        return res.json({

            success: true,

            message:
                "Monetization application submitted successfully.",

            monetization: {

                eligible:
                    monetization.eligible,

                eligibleAt:
                    monetization.eligibleAt,

                status:
                    monetization.status,

                appliedAt:
                    monetization.appliedAt

            }

        });


    } catch (err) {

        console.error(
            "MONETIZATION APPLY ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to submit monetization application."

        });

    }

};


