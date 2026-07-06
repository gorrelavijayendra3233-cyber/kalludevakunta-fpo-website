const express = require("express");
const router = express.Router();
const AuditLog = require("../models/AuditLog");
const auth = require("../middleware/auth"); // Admin auth middleware

// Helper for standardized error messages
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
};

// 1. GET /api/audit-logs (Admin only) - Fetch all logs sorted by date descending
router.get("/", auth, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
