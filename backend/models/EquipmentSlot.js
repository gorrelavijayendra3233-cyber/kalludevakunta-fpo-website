const mongoose = require("mongoose");

const EquipmentSlotSchema = new mongoose.Schema({
  equipmentName: {
    type: String,
    required: true,
  },
  date: {
    type: String, // Date string "YYYY-MM-DD"
    required: true,
  },
  slots: {
    type: Number,
    required: true,
    default: 1
  },
  bookedCount: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

// Enforce unique slots per equipment per day
EquipmentSlotSchema.index({ equipmentName: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("EquipmentSlot", EquipmentSlotSchema);
