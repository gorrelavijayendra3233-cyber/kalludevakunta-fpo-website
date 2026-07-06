const mongoose = require("mongoose");

/**
 * Validates whether a phone number (cleaned) is a valid 10-digit format.
 * @param {string} phone
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length === 10;
};

/**
 * Validates whether a string is a valid MongoDB ObjectId.
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validates if a price is a valid non-negative number.
 * @param {number|string} price
 * @returns {boolean}
 */
const isValidPrice = (price) => {
  const num = Number(price);
  return !isNaN(num) && num >= 0;
};

/**
 * Validates if a quantity is a valid positive number.
 * @param {number|string} qty
 * @returns {boolean}
 */
const isValidQuantity = (qty) => {
  const num = Number(qty);
  return !isNaN(num) && num > 0;
};

/**
 * Validates if a date string is a valid format.
 * @param {string} dateStr
 * @returns {boolean}
 */
const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

module.exports = {
  isValidPhone,
  isValidObjectId,
  isValidPrice,
  isValidQuantity,
  isValidDate
};
