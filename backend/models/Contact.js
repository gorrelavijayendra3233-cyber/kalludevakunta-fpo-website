const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
  name: String,
  fullName: String,
  email: String,
  phone: String,
  village: String,
  inquiryType: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Contact", ContactSchema);