const mongoose = require("mongoose");

const EquipmentBookingSchema = new mongoose.Schema({
  farmerId: String,
  farmerName: String,
  equipmentName: String,
  bookingDate: String,
  phone: String,
  duration: String,
  status: {
    type: String,
    default: "Pending",
  },
  adminRemarks: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

EquipmentBookingSchema.index({ farmerId: 1 });
EquipmentBookingSchema.index({ bookingDate: 1 });
EquipmentBookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  "EquipmentBooking",
  EquipmentBookingSchema
);