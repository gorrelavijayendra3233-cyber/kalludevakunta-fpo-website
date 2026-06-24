const https = require("https");
const NotificationLog = require("../models/NotificationLog");

const sendTelegramMessage = (message, type = "system") => {
  return new Promise((resolve) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.warn("Telegram bot token or chat ID is not configured in .env");
      NotificationLog.create({
        type,
        message,
        status: "Failed",
        error: "Telegram credentials missing in environment"
      }).catch(console.error);
      return resolve(false);
    }

    const payload = JSON.stringify({
      chat_id: chatId,
      text: message
    });

    const options = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      },
      timeout: 15000 // 15 seconds timeout
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && json.ok) {
            NotificationLog.create({
              type,
              message,
              status: "Sent"
            }).catch(console.error);
            resolve(true);
          } else {
            const errMsg = json.description || `HTTP Status ${res.statusCode}`;
            NotificationLog.create({
              type,
              message,
              status: "Failed",
              error: `Telegram API error: ${errMsg}`
            }).catch(console.error);
            console.error("Telegram API sending failed:", json);
            resolve(false);
          }
        } catch (err) {
          NotificationLog.create({
            type,
            message,
            status: "Failed",
            error: `Parsing response failed: ${err.message}`
          }).catch(console.error);
          resolve(false);
        }
      });
    });

    req.on("error", (err) => {
      NotificationLog.create({
        type,
        message,
        status: "Failed",
        error: err.message || "Network error"
      }).catch(console.error);
      console.error("Failed to send Telegram message:", err);
      resolve(false);
    });

    req.on("timeout", () => {
      req.destroy();
      NotificationLog.create({
        type,
        message,
        status: "Failed",
        error: "Request timed out after 15s"
      }).catch(console.error);
      console.error("Telegram request timed out");
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
};

const checkTelegramConnection = () => {
  return new Promise((resolve) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return resolve(false);

    const options = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${token}/getMe`,
      method: "GET",
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(res.statusCode === 200 && json.ok);
        } catch (err) {
          resolve(false);
        }
      });
    });

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
};

module.exports = {
  sendTelegramMessage,
  checkTelegramConnection
};
