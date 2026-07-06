const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const { logAction } = require("../services/auditLogger");

const getAdminUsername = async (adminId) => {
  try {
    const Admin = require("../models/Admin");
    const adminUser = await Admin.findById(adminId);
    return adminUser ? adminUser.username : "admin";
  } catch (err) {
    return "admin";
  }
};

const mongoose = require("mongoose");
const NotificationSettings = require("../models/NotificationSettings");
const NotificationLog = require("../models/NotificationLog");

// A. Get notification settings
router.get("/settings", auth, async (req, res, next) => {
  try {
    let settings = await NotificationSettings.findOne();
    if (!settings) {
      settings = await NotificationSettings.create({ dashboardEnabled: true, telegramEnabled: true });
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// B. Update notification settings
router.put("/settings", auth, async (req, res, next) => {
  try {
    const { dashboardEnabled, telegramEnabled } = req.body;
    let settings = await NotificationSettings.findOne();
    if (!settings) {
      settings = new NotificationSettings();
    }
    if (dashboardEnabled !== undefined) settings.dashboardEnabled = dashboardEnabled;
    if (telegramEnabled !== undefined) settings.telegramEnabled = telegramEnabled;
    await settings.save();

    const adminUsername = await getAdminUsername(req.admin.id);
    await logAction(adminUsername, "Admin", "Settings", "UPDATE", `Notification settings updated: dashboardEnabled=${settings.dashboardEnabled}, telegramEnabled=${settings.telegramEnabled}`, req.ip);

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// C. Get telegram connection status
router.get("/telegram-status", auth, async (req, res, next) => {
  try {
    const { checkTelegramConnection } = require("../services/telegram");
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    let connected = false;
    if (token && chatId) {
      try {
        connected = await checkTelegramConnection();
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
    next(error);
  }
});

// D. Send test Telegram notification
router.post("/test-telegram", auth, async (req, res, next) => {
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
    next(error);
  }
});

// 1. Get All Notifications (Sorted by newest first with limit/pagination)
router.get("/", auth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;

    let queryObj = Notification.find().sort({ createdAt: -1 }).lean();
    if (limit > 0) {
      queryObj = queryObj.skip((page - 1) * limit).limit(limit);
    }

    const [notifications, total] = await Promise.all([
      queryObj,
      Notification.countDocuments()
    ]);

    if (limit > 0) {
      res.setHeader("X-Total-Count", total);
      res.setHeader("X-Total-Pages", Math.ceil(total / limit));
      res.setHeader("X-Page", page);
      res.setHeader("X-Limit", limit);
    }

    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// 1b. Create Custom Notification (useful for system/logger notifications)
router.post("/", auth, async (req, res, next) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// 2. Mark Single Notification as Read
router.put("/:id/read", auth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Notification ID format."
      });
    }

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
    next(error);
  }
});

// 3. Mark All Notifications as Read
router.put("/read-all", auth, async (req, res, next) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

// 3.5. Clear All Notifications
router.delete("/clear-all", auth, async (req, res, next) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    next(error);
  }
});

// 4. Delete Single Notification
router.delete("/:id", auth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Notification ID format."
      });
    }

    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
