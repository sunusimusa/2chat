const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    giftType: {
      type: String,
      required: true,
      trim: true
    },

    coins: {
      type: Number,
      required: true,
      min: 1
    },

    creatorEarning: {
      type: Number,
      default: 0,
      min: 0
    },

    status: {
      type: String,
      enum: [
        "completed",
        "failed"
      ],
      default: "completed"
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model("Gift", giftSchema);
