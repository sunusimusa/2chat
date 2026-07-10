const multer = require("multer");
const path = require("path");

// Store uploaded files temporarily
const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "uploads/");

    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});

const upload = multer({

    storage,

    limits: {

        fileSize: 20 * 1024 * 1024 // 20MB

    },

    fileFilter: function (req, file, cb) {

        if (file.mimetype.startsWith("video/")) {

            cb(null, true);

        } else {

            cb(new Error("Only video files are allowed."));

        }

    }

});

module.exports = upload;
