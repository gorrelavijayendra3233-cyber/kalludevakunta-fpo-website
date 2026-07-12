const mongoose = require("mongoose");

const EquipmentSlotSchema = new mongoose.Schema({
  equipmentId: {
    type: String,
    required: true,
  },
  equipmentName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  slotDuration: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Available", "Booked", "Blocked"],
    default: "Available",
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EquipmentBooking",
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farmer",
  },
  capacity: {
    type: Number,
    required: true,
    default: 1,
  },
  bookedCount: {
    type: Number,
    required: true,
    default: 0,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  }
}, {
  timestamps: true
});

// Enforce unique compound index on equipmentId, startTime, and endTime
EquipmentSlotSchema.index({ equipmentId: 1, startTime: 1, endTime: 1 }, { unique: true });
EquipmentSlotSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model("EquipmentSlot", EquipmentSlotSchema);
