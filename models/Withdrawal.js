const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    // =========================================
    // CREATOR
    // =========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // =========================================
    // WITHDRAWAL AMOUNT
    // =========================================

    amount: {
      type: Number,
      required: true,
      min: 5000
    },

    // =========================================
    // WITHDRAWAL STATUS
    // =========================================

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled"
      ],
      default: "pending",
      index: true
    },

    // =========================================
    // LOCKED BALANCE
    // =========================================

    lockedAmount: {
      type: Number,
      required: true,
      min: 0
    },

    // =========================================
    // PAYOUT REFERENCE
    // =========================================

    payoutReference: {
      type: String,
      default: null,
      trim: true
    },

    // =========================================
    // FAILURE REASON
    // =========================================

    failureReason: {
      type: String,
      default: null,
      trim: true
    },

    // =========================================
    // PROCESSING TIME
    // =========================================

    processingStartedAt: {
      type: Date,
      default: null
    },

    // =========================================
    // COMPLETION TIME
    // =========================================

    completedAt: {
      type: Date,
      default: null
    },

    // =========================================
    // FAILED TIME
    // =========================================

    failedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model(
    "Withdrawal",
    withdrawalSchema
  );
