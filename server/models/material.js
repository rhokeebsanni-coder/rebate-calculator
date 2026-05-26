// models/material.js
const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
    },
    yieldPerTon: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Material", MaterialSchema);
