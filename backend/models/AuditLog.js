const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      default: "System"
    },
    userType: {
      type: String,
      enum: ["Admin", "Farmer", "System"],
      default: "System"
    },
    module: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
