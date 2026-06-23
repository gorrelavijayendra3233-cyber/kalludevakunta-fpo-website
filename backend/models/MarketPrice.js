const mongoose = require("mongoose");

const MarketPriceSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    todayPrice: {
      type: Number,
      required: true
    },
    yesterdayPrice: {
      type: Number,
      default: 0
    },
    trend: {
      type: String,
      enum: ["up", "down", "stable"],
      default: "stable"
    },
    recommendedPrice: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("MarketPrice", MarketPriceSchema);
