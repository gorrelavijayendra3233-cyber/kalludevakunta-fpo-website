const mongoose = require("mongoose");

const CropRequestSchema = new mongoose.Schema({
  farmerName: String,
  cropName: String,
  quantity: Number,
  price: Number,
  phone: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CropRequest", CropRequestSchema);