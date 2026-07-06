const Admin = require("../models/Admin");

/**
 * Sanitizes phone numbers by removing all non-numeric characters.
 * @param {string|number} phone
 * @returns {string}
 */
const cleanPhone = (phone) => {
  return phone ? String(phone).replace(/\D/g, "") : "";
};

/**
 * Resolves the username of an admin by their ObjectID.
 * @param {string} adminId
 * @returns {Promise<string>}
 */
const getAdminUsername = async (adminId) => {
  try {
    const adminUser = await Admin.findById(adminId).lean();
    return adminUser ? adminUser.username : "admin";
  } catch (err) {
    return "admin";
  }
};

module.exports = {
  cleanPhone,
  getAdminUsername
};
