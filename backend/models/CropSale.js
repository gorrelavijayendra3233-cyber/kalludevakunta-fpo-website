const mongoose = require("mongoose");

const cropSaleSchema = new mongoose.Schema(
  {
    cropSaleId: {
      type: String,
      unique: true
    },
    farmerId: {
      type: String,
      required: true
    },
    farmerName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    village: {
      type: String,
      required: true
    },
    cropName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    expectedPrice: {
      type: Number,
      required: true
    },
    estimatedValue: {
      type: Number
    },
    description: {
      type: String
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending"
    },
    adminRemarks: {
      type: String
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    approvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

cropSaleSchema.index({ farmerId: 1 });
cropSaleSchema.index({ status: 1 });
cropSaleSchema.index({ createdAt: -1 });

cropSaleSchema.pre("save", async function () {
  // Automatically calculate estimated value
  this.estimatedValue = this.quantity * this.expectedPrice;

  if (this.isNew) {
    const lastSale = await this.constructor.findOne().sort({ cropSaleId: -1 });
    let nextIdNumber = 1;
    if (lastSale && lastSale.cropSaleId) {
      const match = lastSale.cropSaleId.match(/CS(\d+)/);
      if (match) {
        nextIdNumber = parseInt(match[1], 10) + 1;
      }
    }
    this.cropSaleId = `CS${String(nextIdNumber).padStart(3, "0")}`;
  }
});

module.exports = mongoose.model("CropSale", cropSaleSchema);
