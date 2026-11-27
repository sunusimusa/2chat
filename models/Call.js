const mongoose = require("mongoose");

const callSchema = new mongoose.Schema({
    caller: { type: String, required: true, index: true },
    receiver: { type: String, required: true, index: true },
    status: {
        type: String,
        enum: ["ringing", "accepted", "declined", "missed", "cancelled", "ended"],
        default: "ringing",
        index: true
    },
    startedAt: { type: Date, default: Date.now },
    answeredAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.models.Call || mongoose.model("Call", callSchema);
