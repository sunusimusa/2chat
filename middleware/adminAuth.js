const User = require("../models/User");

const adminAuth = async (req, res, next) => {

    try {

        // protect middleware ya kamata ya riga ya
        // saka authenticated user cikin req.user

        if (!req.user || !req.user._id) {

            return res.status(401).json({
                success: false,
                message: "Not authorized"
            });

        }


        // Nemo user daga database
        const user = await User.findById(
            req.user._id
        ).select("role");


        if (!user) {

            return res.status(401).json({
                success: false,
                message: "User not found"
            });

        }


        // ADMIN ONLY
        if (user.role !== "admin") {

            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });

        }


        // User din admin ne
        req.admin = user;

        next();


    } catch (err) {

        console.error(
            "ADMIN AUTH ERROR:",
            err
        );

        return res.status(500).json({
            success: false,
            message: "Admin authorization failed"
        });

    }

};


module.exports = adminAuth;
