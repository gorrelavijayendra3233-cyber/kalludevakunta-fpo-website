const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const admin = await Admin.findOne({ username: normalizedUsername });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

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
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
});



// POST /api/admin/reset-password
router.post("/reset-password", async (req, res) => {
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
    try {
      const { logAction } = require("../services/auditLogger");
      await logAction(
        admin.username,
        "Admin",
        "Settings",
        "UPDATE",
        "Password Reset",
        req.ip
      );
    } catch (err) {
      console.error("Failed to log password reset:", err);
    }

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
