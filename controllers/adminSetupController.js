const User = require("../models/User");

// =========================================
// ONE-TIME ADMIN SETUP
// =========================================

exports.setupAdmin = async (req, res) => {

    try {

        const {
            username,
            email,
            secret
        } = req.body;


        // =========================================
        // CHECK SECRET
        // =========================================

        if (!process.env.ADMIN_SETUP_SECRET) {

            return res.status(500).json({
                success: false,
                message: "Admin setup secret is not configured."
            });

        }


        if (
            !secret ||
            secret !== process.env.ADMIN_SETUP_SECRET
        ) {

            return res.status(403).json({
                success: false,
                message: "Invalid admin setup secret."
            });

        }


        // =========================================
        // USER IDENTIFIER REQUIRED
        // =========================================

        if (!username && !email) {

            return res.status(400).json({
                success: false,
                message: "Username or email is required."
            });

        }


        // =========================================
        // FIND USER
        // =========================================

        const query = username
            ? { username }
            : { email };


        const user =
            await User.findOne(query);


        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        // =========================================
        // ALREADY ADMIN
        // =========================================

        if (user.role === "admin") {

            return res.json({
                success: true,
                message: "User is already an admin.",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });

        }


        // =========================================
        // MAKE ADMIN
        // =========================================

        user.role = "admin";

        await user.save();


        // =========================================
        // RESPONSE
        // =========================================

        return res.json({

            success: true,

            message:
                "User has been successfully promoted to admin.",

            user: {

                id: user._id,

                username:
                    user.username,

                email:
                    user.email,

                role:
                    user.role

            }

        });


    } catch (err) {

        console.error(
            "ADMIN SETUP ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to setup admin."

        });

    }

};
