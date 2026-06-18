const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    rateHour: {
      type: Number,
      required: true,
    },
    rateDay: {
      type: Number,
      required: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate EQxxx identifier if not provided
equipmentSchema.pre("save", async function () {
  if (this.isNew && !this.equipmentId) {
    const lastEquipment = await this.constructor
      .findOne({ equipmentId: /^EQ\d+$/ })
      .sort({ equipmentId: -1 });
    let nextIdNumber = 1;
    if (lastEquipment && lastEquipment.equipmentId) {
      const match = lastEquipment.equipmentId.match(/EQ(\d+)/);
      if (match) {
        nextIdNumber = parseInt(match[1], 10) + 1;
      }
    }
    this.equipmentId = `EQ${String(nextIdNumber).padStart(3, "0")}`;
  }
});

module.exports = mongoose.model("Equipment", equipmentSchema);
