const NotificationLog = require("../models/NotificationLog");

const sendTelegramMessage = async (message, type = "system") => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
console.log("=== TELEGRAM FUNCTION CALLED ===");
console.log("TOKEN EXISTS:", !!process.env.TELEGRAM_BOT_TOKEN);
console.log("CHAT ID:", process.env.TELEGRAM_CHAT_ID);
  if (!token || !chatId) {
    console.warn("Telegram bot token or chat ID is not configured in .env");
    await NotificationLog.create({
      type,
      message,
      status: "Failed",
      error: "Telegram credentials missing in environment"
    });
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      }),
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      await NotificationLog.create({
        type,
        message,
        status: "Sent"
      });
      return true;
    } else {
      const errMsg = data.description || "Unknown error";
      await NotificationLog.create({
        type,
        message,
        status: "Failed",
        error: `Telegram API error: ${errMsg}`
      });
      console.error("Telegram API sending failed:", data);
      return false;
    }
  } catch (err) {
    await NotificationLog.create({
      type,
      message,
      status: "Failed",
      error: err.message || "Network error"
    });
    console.error("Failed to send Telegram message:", err);
    return false;
  }
};

module.exports = { sendTelegramMessage };
