const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

// Helper for standardized error messages
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: error.message || "An unexpected error occurred."
  });
};

const NotificationSettings = require("../models/NotificationSettings");
const NotificationLog = require("../models/NotificationLog");

// A. Get notification settings
router.get("/settings", auth, async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne();
    if (!settings) {
      settings = await NotificationSettings.create({ dashboardEnabled: true, telegramEnabled: true });
    }
    res.json(settings);
  } catch (error) {
    handleError(res, error);
  }
});

// B. Update notification settings
router.put("/settings", auth, async (req, res) => {
  try {
    const { dashboardEnabled, telegramEnabled } = req.body;
    let settings = await NotificationSettings.findOne();
    if (!settings) {
      settings = new NotificationSettings();
    }
    if (dashboardEnabled !== undefined) settings.dashboardEnabled = dashboardEnabled;
    if (telegramEnabled !== undefined) settings.telegramEnabled = telegramEnabled;
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    handleError(res, error);
  }
});

// C. Get telegram connection status
router.get("/telegram-status", auth, async (req, res) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    let connected = false;
    if (token && chatId) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(5000) });
        const data = response.ok ? await response.json() : null;
        if (data && data.ok) {
          connected = true;
        }
      } catch (err) {
        console.error("Telegram status check failed:", err);
        const lastSent = await NotificationLog.findOne({ status: "Sent" });
        if (lastSent) {
          connected = true;
        }
      }
    }

    const lastSentLog = await NotificationLog.findOne({ status: "Sent" }).sort({ createdAt: -1 });

    res.json({
      success: true,
      connected,
      lastNotificationSent: lastSentLog ? lastSentLog.createdAt : null
    });
  } catch (error) {
    handleError(res, error);
  }
});

// D. Send test Telegram notification
router.post("/test-telegram", auth, async (req, res) => {
  try {
    const { sendTelegramMessage } = require("../services/telegram");
    const message = "Test notification from Kalludevakunta FPO";
    const result = await sendTelegramMessage(message, "system");
    
    if (result) {
      res.json({ success: true, message: "Test telegram notification sent successfully." });
    } else {
      res.status(400).json({ success: false, message: "Failed to send test telegram message. Check credentials." });
    }
  } catch (error) {
    handleError(res, error);
  }
});

// 1. Get All Notifications (Sorted by newest first with limit)
router.get("/", auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(notifications);
  } catch (error) {
    handleError(res, error);
  }
});

// 1b. Create Custom Notification (useful for system/logger notifications)
router.post("/", auth, async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    handleError(res, error);
  }
});

// 2. Mark Single Notification as Read
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    handleError(res, error);
  }
});

// 3. Mark All Notifications as Read
router.put("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    handleError(res, error);
  }
});

// 3.5. Clear All Notifications
router.delete("/clear-all", auth, async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    handleError(res, error);
  }
});

// 4. Delete Single Notification
router.delete("/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
