const AuditLog = require("../models/AuditLog");

/**
 * Logs an action to the database.
 * @param {string} user - Username or name of the user performing the action
 * @param {string} userType - "Admin", "Farmer", or "System"
 * @param {string} module - "Farmers", "Crops", "Bookings", "Products", "Announcements", "Market Prices", "Documents", "Settings"
 * @param {string} action - "CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "LOGIN"
 * @param {string} details - Detailed human-readable description of the mutation
 * @param {string} [ipAddress] - IP address of the client
 */
const logAction = async (user, userType, module, action, details, ipAddress = "") => {
  try {
    const log = new AuditLog({
      user: user || "System",
      userType: userType || "System",
      module,
      action,
      details,
      ipAddress
    });
    await log.save();
    console.log(`[AUDIT LOG] ${action} on ${module}: ${details}`);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};

module.exports = { logAction };
