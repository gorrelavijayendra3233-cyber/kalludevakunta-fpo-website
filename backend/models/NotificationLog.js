const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Sent", "Failed"],
      required: true,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("NotificationLog", notificationLogSchema);
