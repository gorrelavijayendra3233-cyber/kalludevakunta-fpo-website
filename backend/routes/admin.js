const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authLimiter } = require("../middleware/rateLimiters");
const { logAction } = require("../services/auditLogger");

// POST /api/admin/login
router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const admin = await Admin.findOne({ username: normalizedUsername });
    if (!admin) {
      // Audit log failed login
      await logAction(normalizedUsername, "Admin", "AdminAuth", "LOGIN_FAIL", `Failed admin login: username not found`, req.ip);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      // Audit log failed login
      await logAction(admin.username, "Admin", "AdminAuth", "LOGIN_FAIL", `Failed admin login: incorrect password`, req.ip);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Include explicit 'role' field in token payload for role-based authorization
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Audit log successful login
    await logAction(admin.username, "Admin", "AdminAuth", "LOGIN_SUCCESS", `Successful admin login`, req.ip);

    try {
      const Notification = require("../models/Notification");
      await Notification.create({
        title: "Admin Login",
        message: `Admin '${username}' logged in successfully.`,
        type: "system",
        priority: "medium"
      });
    } catch (err) {
      console.error("Failed to create admin login notification:", err);
    }

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/reset-password
router.post("/reset-password", authLimiter, async (req, res, next) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Username, old password, and new password are required" });
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (!["bheemaiah", "director", "admin"].includes(normalizedUsername)) {
      return res.status(400).json({ success: false, message: "This username is not authorized for password recovery" });
    }

    const admin = await Admin.findOne({ username: normalizedUsername });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    // Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    // Minimum password rules check
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character."
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.lastPasswordChange = new Date();
    await admin.save();

    // Log action to audit logs
    await logAction(
      admin.username,
      "Admin",
      "Settings",
      "UPDATE",
      "Password Reset",
      req.ip
    );

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/verify-old-password
router.post("/verify-old-password", authLimiter, async (req, res, next) => {
  try {
    const { username, oldPassword } = req.body;

    if (!username || !oldPassword) {
      return res.status(400).json({ success: false, message: "Username and old password are required" });
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (!["bheemaiah", "director", "admin"].includes(normalizedUsername)) {
      return res.status(400).json({ success: false, message: "This username is not authorized for password recovery" });
    }

    const admin = await Admin.findOne({ username: normalizedUsername });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    // Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    res.json({ success: true, message: "Credentials verified successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
