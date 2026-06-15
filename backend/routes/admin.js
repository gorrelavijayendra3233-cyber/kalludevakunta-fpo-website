const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
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

module.exports = router;
