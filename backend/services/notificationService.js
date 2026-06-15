const Notification = require("../models/Notification");
const NotificationSettings = require("../models/NotificationSettings");
const { sendTelegramMessage } = require("./telegram");

const triggerNotification = async ({ title, dashboardMessage, telegramMessage, type, priority = "medium" }) => {
  try {
    let settings = await NotificationSettings.findOne();
    if (!settings) {
      settings = { dashboardEnabled: true, telegramEnabled: true };
    }

    // 1. Send Dashboard Notification if enabled
    if (settings.dashboardEnabled) {
      try {
        await Notification.create({
          title,
          message: dashboardMessage,
          type,
          priority,
        });
      } catch (err) {
        console.error("Failed to create dashboard notification:", err);
      }
    }

    // 2. Send Telegram Message if enabled
    if (settings.telegramEnabled) {
      try {
        await sendTelegramMessage(telegramMessage, type);
      } catch (err) {
        console.error("Failed to send telegram notification:", err);
      }
    }
  } catch (err) {
    console.error("Error in triggerNotification service:", err);
  }
};

module.exports = { triggerNotification };
