const mongoose = require("mongoose");

const notificationSettingsSchema = new mongoose.Schema(
  {
    dashboardEnabled: {
      type: Boolean,
      default: true,
    },
    telegramEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("NotificationSettings", notificationSettingsSchema);
