const express = require("express");
const router = express.Router();
const Farmer = require("../models/Farmer");
const jwt = require("jsonwebtoken");

// POST /api/farmer-auth/verify
router.post("/verify", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required."
      });
    }

    const trimmedPhone = String(phone).trim();

    // Find farmer by phone number
    const farmer = await Farmer.findOne({ phone: trimmedPhone });
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not registered / మొబైల్ నంబర్ నమోదు కాలేదు"
      });
    }

    // Farmer status must be Active
    if (farmer.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Farmer account is inactive. Please contact the administrator. / రైతు ఖాతా నిష్క్రియంగా ఉంది."
      });
    }

    // Track Last Login
    farmer.lastLogin = new Date();
    await farmer.save();

    // Sign JWT token with 7-day expiration
    const token = jwt.sign(
      {
        id: farmer._id,
        farmerId: farmer.farmerId,
        name: farmer.name,
        phone: farmer.phone
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      success: true,
      message: "Login successful.",
      token,
      farmer: {
        id: farmer._id,
        farmerId: farmer.farmerId,
        name: farmer.name,
        phone: farmer.phone,
        village: farmer.village,
        mandal: farmer.mandal,
        district: farmer.district,
        cropType: farmer.cropType,
        landHolding: farmer.landHolding
      }
    });
  } catch (error) {
    console.error("Farmer Login Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred during login."
    });
  }
});

module.exports = router;
