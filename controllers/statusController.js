const Status = require("../models/Status");
const cloudinary = require("../config/cloudinary");

// ================= CREATE STATUS =================
exports.createStatus = async (req, res) => {
  try {

    const { username, type, media, text } = req.body;

    let mediaUrl = "";

    if (media) {

      const result = await cloudinary.uploader.upload(media, {
        folder: "2chat-status",
        resource_type: type === "video" ? "video" : "image"
      });

      mediaUrl = result.secure_url;
    }

    const status = await Status.create({
      username,
      type,
      media: mediaUrl,
      text
    });

    res.json({
      success: true,
      status
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

// ================= GET ALL STATUS =================
exports.getStatuses = async (req, res) => {

  try {

    const statuses = await Status.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      statuses
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};

// ================= GET ONE STATUS =================
exports.getStatusById = async (req, res) => {

  try {

    const status = await Status.findById(req.params.id);

    if (!status) {

      return res.json({
        success: false,
        message: "Status not found"
      });

    }

    res.json({
      success: true,
      status
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};
