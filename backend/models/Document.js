const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ["Government Schemes", "Training Manuals", "Crop Guides", "FPO Forms", "Other"],
      default: "Other"
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: String,
      default: "Unknown"
    },
    uploadedBy: {
      type: String,
      default: "Admin"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Document", DocumentSchema);
