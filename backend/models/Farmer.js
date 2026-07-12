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
    farmerName: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    state: {
      type: String,
      default: "Andhra Pradesh",
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
    primaryCrop: {
      type: String,
    },
    surveyNumber: {
      type: String,
      default: "",
    },
    aadharNumber: {
      type: String,
      default: "",
    },
    landHolding: {
      type: Number,
    },
    landArea: {
      type: String,
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
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

farmerSchema.index({ village: 1 });
farmerSchema.index({ name: 1 });

farmerSchema.pre("save", async function () {
  if (this.farmerName && !this.name) {
    this.name = this.farmerName;
  } else if (this.name && !this.farmerName) {
    this.farmerName = this.name;
  }

  if (this.primaryCrop && !this.cropType) {
    this.cropType = this.primaryCrop;
  } else if (this.cropType && !this.primaryCrop) {
    this.primaryCrop = this.cropType;
  }

  if (this.landArea && (this.landHolding === undefined || this.landHolding === null)) {
    this.landHolding = parseFloat(this.landArea) || 0;
  } else if (this.landHolding !== undefined && this.landHolding !== null && !this.landArea) {
    this.landArea = `${this.landHolding} Acres`;
  }

  if (this.aadharNumber && this.aadharNumber.trim().length >= 4) {
    const trimmed = this.aadharNumber.trim();
    this.aadhaarLast4 = trimmed.substring(trimmed.length - 4);
  }

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
