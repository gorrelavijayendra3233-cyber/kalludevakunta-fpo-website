const express = require("express");
const router = express.Router();
const Farmer = require("../models/Farmer");
const CropRequest = require("../models/CropRequest");
const EquipmentBooking = require("../models/EquipmentBooking");
const ProductBooking = require("../models/ProductBooking");
const jwt = require("jsonwebtoken");
const farmerAuth = require("../middleware/farmerAuth");

// Helper to normalize phone numbers to last 10 digits
const cleanPhone = (p) => {
  let s = String(p).trim().replace(/\D/g, "");
  if (s.length > 10) {
    s = s.substring(s.length - 10);
  }
  return s;
};

// POST /api/farmer/login
router.post("/login", async (req, res) => {
  try {
    // 3. Add logging at the top:
    console.log("LOGIN BODY:", req.body);

    const { phone, otpToken } = req.body;

    // 4. Log:
    console.log("PHONE:", phone);
    console.log("OTP TOKEN:", otpToken);

    // 7. Before any validation add:
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "phone missing"
      });
    }

    if (!otpToken) {
      return res.status(400).json({
        success: false,
        message: "otpToken missing"
      });
    }

    // Verify access token with MSG91
    const authKey = process.env.MSG91_AUTH_KEY || "533115AysFGtd672h56a33bd4dP1";
    const response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "authkey": authKey,
        "access-token": otpToken
      })
    });

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: `MSG91 server-side verification failed with status ${response.status}.`
      });
    }

    const verifyData = await response.json();
    response.data = verifyData;

    // 8. Log full MSG91 verification response:
    console.log("MSG91 VERIFY:", response.data);

    // Write raw response to file for diagnostics
    try {
      const fs = require("fs");
      const path = require("path");
      fs.writeFileSync(path.join(__dirname, "../msg91_verify_raw.json"), JSON.stringify(verifyData, null, 2));
    } catch (fsErr) {
      console.error("Write raw response error:", fsErr);
    }

    if (verifyData.type !== "success" && verifyData.status !== "success") {
      return res.status(400).json({
        success: false,
        message: verifyData.message || "Invalid or expired OTP access token."
      });
    }

    // Extract verified phone number from MSG91 response
    let extractedPhone = "";
    if (verifyData.message && typeof verifyData.message === "string" && /^\d+$/.test(verifyData.message)) {
      extractedPhone = verifyData.message;
    } else if (verifyData.mobile) {
      extractedPhone = verifyData.mobile;
    } else if (verifyData.phone) {
      extractedPhone = verifyData.phone;
    } else if (verifyData.phone_number) {
      extractedPhone = verifyData.phone_number;
    } else if (verifyData.data) {
      if (typeof verifyData.data === "string") {
        extractedPhone = verifyData.data;
      } else if (typeof verifyData.data === "object") {
        extractedPhone = verifyData.data.mobile || verifyData.data.phone || verifyData.data.phone_number || "";
      }
    }

    const cleanExtracted = cleanPhone(extractedPhone);
    const cleanNum = cleanPhone(phone);

    if (cleanExtracted !== cleanNum) {
      return res.status(400).json({
        success: false,
        message: `Mobile number mismatch during verification. Extracted: '${cleanExtracted}', Submitted: '${cleanNum}'. Raw: ${JSON.stringify(verifyData)}`
      });
    }

    // 9. Log farmer lookup:
    console.log("Searching farmer:", phone);

    const farmer = await Farmer.findOne({ phone: cleanNum });
    if (!farmer) {
      // 10. If farmer not found:
      return res.status(404).json({
        success: false,
        message: "Farmer not found"
      });
    }

    // Check status
    if (farmer.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Farmer account is inactive. Please contact the administrator."
      });
    }

    // Track login info
    farmer.lastLogin = new Date();
    if (!farmer.isVerified) {
      farmer.isVerified = true;
    }
    await farmer.save();

    let token;
    try {
      // Sign JWT token with 30-day expiration
      token = jwt.sign(
        {
          farmerId: farmer._id
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "30d"
        }
      );
    } catch (jwtErr) {
      // 11. If JWT creation fails, return actual error.
      return res.status(500).json({
        success: false,
        message: `JWT creation failed: ${jwtErr.message}`
      });
    }

    res.json({
      success: true,
      message: "Login successful.",
      token,
      farmer: {
        id: farmer._id,
        farmerId: farmer.farmerId,
        farmerName: farmer.farmerName,
        name: farmer.name,
        phone: farmer.phone,
        village: farmer.village,
        landArea: farmer.landArea,
        landHolding: farmer.landHolding,
        primaryCrop: farmer.primaryCrop,
        cropType: farmer.cropType,
        isVerified: farmer.isVerified,
        status: farmer.status
      }
    });
  } catch (error) {
    console.error("Farmer Login Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during login."
    });
  }
});

// POST /api/farmer/register
router.post("/register", async (req, res) => {
  try {
    const { farmerName, village, phone, landArea, primaryCrop } = req.body;

    if (!farmerName || !village || !phone) {
      return res.status(400).json({
        success: false,
        message: "Farmer Name, Village, and Phone Number are required."
      });
    }

    const cleanNum = cleanPhone(phone);
    if (cleanNum.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number."
      });
    }

    // Check if farmer already exists
    const existingFarmer = await Farmer.findOne({ phone: cleanNum });
    if (existingFarmer) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is already registered. Please log in."
      });
    }

    // Create farmer
    const newFarmer = new Farmer({
      farmerName,
      name: farmerName,
      village,
      phone: cleanNum,
      landArea,
      primaryCrop,
      isVerified: true,
      status: "Active",
      lastLogin: new Date()
    });

    await newFarmer.save();

    // Sign JWT token with 30-day expiration
    const token = jwt.sign(
      {
        farmerId: newFarmer._id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d"
      }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      farmer: {
        id: newFarmer._id,
        farmerId: newFarmer.farmerId,
        farmerName: newFarmer.farmerName,
        name: newFarmer.name,
        phone: newFarmer.phone,
        village: newFarmer.village,
        landArea: newFarmer.landArea,
        landHolding: newFarmer.landHolding,
        primaryCrop: newFarmer.primaryCrop,
        cropType: newFarmer.cropType,
        isVerified: newFarmer.isVerified,
        status: newFarmer.status
      }
    });
  } catch (error) {
    console.error("Farmer Registration Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during registration."
    });
  }
});

// POST /api/farmer/verify-msg91 (For compatibility)
router.post("/verify-msg91", async (req, res) => {
  try {
    const { action, otpToken, farmerName, village, landArea, primaryCrop } = req.body;

    if (!otpToken) {
      return res.status(400).json({
        success: false,
        message: "OTP verification token is required."
      });
    }

    const authKey = process.env.MSG91_AUTH_KEY || "533115AysFGtd672h56a33bd4dP1";
    const response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "authkey": authKey,
        "access-token": otpToken
      })
    });

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: `MSG91 server-side verification failed with status ${response.status}.`
      });
    }

    const verifyData = await response.json();
    if (verifyData.type !== "success" && verifyData.status !== "success") {
      return res.status(400).json({
        success: false,
        message: verifyData.message || "Invalid or expired OTP access token."
      });
    }

    let extractedPhone = "";
    if (verifyData.message && typeof verifyData.message === "string" && /^\d+$/.test(verifyData.message)) {
      extractedPhone = verifyData.message;
    } else if (verifyData.mobile) {
      extractedPhone = verifyData.mobile;
    } else if (verifyData.phone) {
      extractedPhone = verifyData.phone;
    } else if (verifyData.phone_number) {
      extractedPhone = verifyData.phone_number;
    } else if (verifyData.data) {
      if (typeof verifyData.data === "string") {
        extractedPhone = verifyData.data;
      } else if (typeof verifyData.data === "object") {
        extractedPhone = verifyData.data.mobile || verifyData.data.phone || verifyData.data.phone_number || "";
      }
    }

    const cleanExtracted = cleanPhone(extractedPhone);
    if (!cleanExtracted || cleanExtracted.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Failed to extract a valid 10-digit mobile number from MSG91 verification."
      });
    }

    if (action === "register") {
      if (!farmerName || !village) {
        return res.status(400).json({
          success: false,
          message: "Farmer Name and Village are required for registration."
        });
      }

      const existingFarmer = await Farmer.findOne({ phone: cleanExtracted });
      if (existingFarmer) {
        return res.status(400).json({
          success: false,
          message: "Mobile number is already registered. Please log in."
        });
      }

      const newFarmer = new Farmer({
        farmerName,
        name: farmerName,
        village,
        phone: cleanExtracted,
        landArea,
        primaryCrop,
        isVerified: true,
        status: "Active",
        lastLogin: new Date()
      });

      await newFarmer.save();

      const token = jwt.sign(
        { farmerId: newFarmer._id },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      return res.status(201).json({
        success: true,
        message: "Registration successful.",
        token,
        farmer: {
          id: newFarmer._id,
          farmerId: newFarmer.farmerId,
          farmerName: newFarmer.farmerName,
          name: newFarmer.name,
          phone: newFarmer.phone,
          village: newFarmer.village,
          landArea: newFarmer.landArea,
          landHolding: newFarmer.landHolding,
          primaryCrop: newFarmer.primaryCrop,
          cropType: newFarmer.cropType,
          isVerified: newFarmer.isVerified,
          status: newFarmer.status
        }
      });
    } else {
      const farmer = await Farmer.findOne({ phone: cleanExtracted });
      if (!farmer) {
        return res.status(404).json({
          success: false,
          message: "Farmer not registered. Please register first."
        });
      }

      if (farmer.status !== "Active") {
        return res.status(403).json({
          success: false,
          message: "Farmer account is inactive. Please contact the administrator."
        });
      }

      farmer.lastLogin = new Date();
      if (!farmer.isVerified) {
        farmer.isVerified = true;
      }
      await farmer.save();

      const token = jwt.sign(
        { farmerId: farmer._id },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      return res.json({
        success: true,
        message: "Login successful.",
        token,
        farmer: {
          id: farmer._id,
          farmerId: farmer.farmerId,
          farmerName: farmer.farmerName,
          name: farmer.name,
          phone: farmer.phone,
          village: farmer.village,
          landArea: farmer.landArea,
          landHolding: farmer.landHolding,
          primaryCrop: farmer.primaryCrop,
          cropType: farmer.cropType,
          isVerified: farmer.isVerified,
          status: farmer.status
        }
      });
    }
  } catch (error) {
    console.error("verify-msg91 error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred during verification."
    });
  }
});

// GET /api/farmer/profile
router.get("/profile", farmerAuth, async (req, res) => {
  try {
    const farmer = req.farmer;
    res.json({
      success: true,
      farmer: {
        id: farmer._id,
        farmerId: farmer.farmerId,
        farmerName: farmer.farmerName,
        name: farmer.name,
        phone: farmer.phone,
        village: farmer.village,
        landArea: farmer.landArea,
        landHolding: farmer.landHolding,
        primaryCrop: farmer.primaryCrop,
        cropType: farmer.cropType,
        isVerified: farmer.isVerified,
        status: farmer.status
      }
    });
  } catch (error) {
    console.error("Fetch Farmer Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred fetching profile."
    });
  }
});

// PUT /api/farmer/profile
router.put("/profile", farmerAuth, async (req, res) => {
  try {
    const farmer = req.farmer;
    const { farmerName, name, village, landArea, landHolding, primaryCrop, cropType } = req.body;

    const finalFarmerName = farmerName || name;
    const finalVillage = village;
    const finalLandArea = landArea;
    const finalPrimaryCrop = primaryCrop || cropType;

    if (finalFarmerName) {
      farmer.farmerName = finalFarmerName;
      farmer.name = finalFarmerName;
    }
    if (finalVillage) {
      farmer.village = finalVillage;
    }
    if (finalLandArea !== undefined) {
      farmer.landArea = finalLandArea;
      farmer.landHolding = parseFloat(finalLandArea) || 0;
    }
    if (finalPrimaryCrop) {
      farmer.primaryCrop = finalPrimaryCrop;
      farmer.cropType = finalPrimaryCrop;
    }

    await farmer.save();

    res.json({
      success: true,
      message: "Profile updated successfully.",
      farmer: {
        id: farmer._id,
        farmerId: farmer.farmerId,
        farmerName: farmer.farmerName,
        name: farmer.name,
        phone: farmer.phone,
        village: farmer.village,
        landArea: farmer.landArea,
        landHolding: farmer.landHolding,
        primaryCrop: farmer.primaryCrop,
        cropType: farmer.cropType,
        isVerified: farmer.isVerified,
        status: farmer.status
      }
    });
  } catch (error) {
    console.error("Update Farmer Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred updating profile."
    });
  }
});

// GET /api/farmer/crop-requests
router.get("/crop-requests", farmerAuth, async (req, res) => {
  try {
    const cropRequests = await CropRequest.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 });
    res.json(cropRequests);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/farmer/bookings
router.get("/bookings", farmerAuth, async (req, res) => {
  try {
    const bookings = await EquipmentBooking.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/farmer/orders
router.get("/orders", farmerAuth, async (req, res) => {
  try {
    const orders = await ProductBooking.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
