const mongoose = require("mongoose");

const SnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
      index: true,
    },
    grossTotal: {
      type: Number,
      required: true,
    },
    rebate: {
      type: Number,
      required: true,
      default: 0,
    },
    netTotal: {
      type: Number,
      required: true,
    },
    items: [
      {
        name: { type: String, required: true },
        yieldperton: { type: Number, required: true },
        calculatedUnitPrice: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true },
);

SnapshotSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Snapshot", SnapshotSchema);
