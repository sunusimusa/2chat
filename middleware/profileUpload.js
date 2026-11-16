const multer = require("multer");

const storage = multer.memoryStorage();

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const profileUpload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
        fields: 10,
        parts: 11
    },

    fileFilter: (req, file, cb) => {
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Only JPG, PNG and WEBP images are allowed."
                )
            );
        }

        cb(null, true);
    }
});

const validateProfileImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image selected."
            });
        }

        const { fileTypeFromBuffer } = await import("file-type");

        const detectedType = await fileTypeFromBuffer(
            req.file.buffer
        );

        if (
            !detectedType ||
            !allowedTypes.includes(detectedType.mime) ||
            detectedType.mime !== req.file.mimetype
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid image. Only genuine JPG, PNG and WEBP files are allowed."
            });
        }

        next();

    } catch (error) {
        console.error(
            "PROFILE IMAGE VALIDATION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to validate profile image."
        });
    }
};

module.exports = {
    profileUpload,
    validateProfileImage
};
            
