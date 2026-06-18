const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema(
  {
    farmerId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    village: {
      type: String,
      required: true,
    },
    mandal: {
      type: String,
    },
    district: {
      type: String,
    },
    cropType: {
      type: String,
    },
    landHolding: {
      type: Number,
    },
    gender: {
      type: String,
    },
    aadhaarLast4: {
      type: String,
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      default: "Active",
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

farmerSchema.pre("save", async function () {
  if (this.isNew) {
    const lastFarmer = await this.constructor.findOne().sort({ farmerId: -1 });
    let nextIdNumber = 1;
    if (lastFarmer && lastFarmer.farmerId) {
      const match = lastFarmer.farmerId.match(/FPO(\d+)/);
      if (match) {
        nextIdNumber = parseInt(match[1], 10) + 1;
      }
    }
    this.farmerId = `FPO${String(nextIdNumber).padStart(3, "0")}`;
  }
});

module.exports = mongoose.model("Farmer", farmerSchema);
