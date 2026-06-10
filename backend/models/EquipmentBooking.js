const mongoose = require("mongoose");

const EquipmentBookingSchema = new mongoose.Schema({
  farmerName: String,
  equipmentName: String,
  bookingDate: String,
  phone: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "EquipmentBooking",
  EquipmentBookingSchema
);