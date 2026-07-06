const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Farmer = require("../models/Farmer");
const CropRequest = require("../models/CropRequest");
const EquipmentBooking = require("../models/EquipmentBooking");
const ProductBooking = require("../models/ProductBooking");
const CropSale = require("../models/CropSale");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");
const farmerAuth = require("../middleware/farmerAuth");
const { logAction } = require("../services/auditLogger");
const { authLimiter } = require("../middleware/rateLimiters");
const { cleanPhone } = require("../utils/helpers");
const asyncHandler = require("../utils/asyncHandler");
const { isValidObjectId } = require("../utils/validators");

// POST /api/farmer/login
router.post("/login", authLimiter, asyncHandler(async (req, res, next) => {
    const { phone, otpToken } = req.body;

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

    await logAction(farmer.name, "Farmer", "Farmers", "LOGIN", `Farmer logged in successfully via phone: ${farmer.phone}`, req.ip);

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
      return next(jwtErr);
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
        state: farmer.state,
        district: farmer.district,
        mandal: farmer.mandal,
        village: farmer.village,
        landArea: farmer.landArea,
        landHolding: farmer.landHolding,
        primaryCrop: farmer.primaryCrop,
        cropType: farmer.cropType,
        isVerified: farmer.isVerified,
        status: farmer.status
      }
    });
}));
// POST /api/farmer/register
router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { farmerName, state, district, mandal, village, phone, landArea, primaryCrop } = req.body;

    if (!farmerName || !phone || !state || !district || !mandal || !village) {
      return res.status(400).json({
        success: false,
        message: "Farmer Name, Phone Number, State, District, Mandal, and Village are required."
      });
    }

    if (typeof farmerName !== "string" || farmerName.trim() === "" || farmerName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid farmer name (maximum 100 characters)."
      });
    }

    if (landArea !== undefined) {
      const numArea = parseFloat(landArea);
      if (isNaN(numArea) || numArea < 0) {
        return res.status(400).json({
          success: false,
          message: "Land holding area must be a non-negative number."
        });
      }
    }

    const { validateLocationHierarchy } = require("./locations");
    const validation = await validateLocationHierarchy({ state, district, mandal, village });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
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
      farmerName: farmerName.trim(),
      name: farmerName.trim(),
      state: String(state).trim(),
      district: String(district).trim(),
      mandal: String(mandal).trim(),
      village: String(village).trim(),
      phone: cleanNum,
      landArea: landArea ? String(landArea).trim() : "",
      primaryCrop: primaryCrop ? String(primaryCrop).trim() : "",
      isVerified: true,
      status: "Active",
      lastLogin: new Date()
    });

    await newFarmer.save();

    await logAction(newFarmer.name, "Farmer", "Farmers", "CREATE", `New farmer registered: ${newFarmer.name} (Phone: ${newFarmer.phone}, State: ${newFarmer.state}, Village: ${newFarmer.village})`, req.ip);

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
        state: newFarmer.state,
        district: newFarmer.district,
        mandal: newFarmer.mandal,
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
    next(error);
  }
});

// POST /api/farmer/verify-msg91 (For compatibility)
router.post("/verify-msg91", authLimiter, async (req, res, next) => {
  try {
    const { action, otpToken, farmerName, state, district, mandal, village, landArea, primaryCrop } = req.body;

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
      if (!farmerName || !state || !district || !mandal || !village) {
        return res.status(400).json({
          success: false,
          message: "Farmer Name, State, District, Mandal, and Village are required for registration."
        });
      }

      if (typeof farmerName !== "string" || farmerName.trim() === "" || farmerName.length > 100) {
        return res.status(400).json({ success: false, message: "Invalid farmer name (maximum 100 characters)." });
      }

      const { validateLocationHierarchy } = require("./locations");
      const validation = await validateLocationHierarchy({ state, district, mandal, village });
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
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
        farmerName: farmerName.trim(),
        name: farmerName.trim(),
        state: String(state).trim(),
        district: String(district).trim(),
        mandal: String(mandal).trim(),
        village: String(village).trim(),
        phone: cleanExtracted,
        landArea: landArea ? String(landArea).trim() : "",
        primaryCrop: primaryCrop ? String(primaryCrop).trim() : "",
        isVerified: true,
        status: "Active",
        lastLogin: new Date()
      });

      await newFarmer.save();

      await logAction(newFarmer.name, "Farmer", "Farmers", "CREATE", `New farmer registered via verify-msg91: ${newFarmer.name} (Phone: ${newFarmer.phone}, State: ${newFarmer.state}, Village: ${newFarmer.village})`, req.ip);

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
          state: newFarmer.state,
          district: newFarmer.district,
          mandal: newFarmer.mandal,
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

      await logAction(farmer.name, "Farmer", "Farmers", "LOGIN", `Farmer logged in via verify-msg91 (Phone: ${farmer.phone})`, req.ip);

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
          state: farmer.state,
          district: farmer.district,
          mandal: farmer.mandal,
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
    next(error);
  }
});

// GET /api/farmer/profile
router.get("/profile", farmerAuth, async (req, res, next) => {
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
        state: farmer.state,
        district: farmer.district,
        mandal: farmer.mandal,
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
    next(error);
  }
});

// PUT /api/farmer/profile
router.put("/profile", farmerAuth, async (req, res, next) => {
  try {
    const farmer = req.farmer;
    const { farmerName, name, state, district, mandal, village, landArea, primaryCrop, cropType } = req.body;

    const finalFarmerName = farmerName || name;
    const finalLandArea = landArea;
    const finalPrimaryCrop = primaryCrop || cropType;

    if (finalFarmerName !== undefined && (typeof finalFarmerName !== "string" || finalFarmerName.trim() === "" || finalFarmerName.length > 100)) {
      return res.status(400).json({ success: false, message: "Invalid farmer name (maximum 100 characters)." });
    }

    if (finalLandArea !== undefined) {
      const numArea = parseFloat(finalLandArea);
      if (isNaN(numArea) || numArea < 0) {
        return res.status(400).json({ success: false, message: "Land area must be a non-negative number." });
      }
    }

    if (state || district || mandal || village) {
      const updatedState = state || farmer.state || "Andhra Pradesh";
      const updatedDistrict = district || farmer.district;
      const updatedMandal = mandal || farmer.mandal;
      const updatedVillage = village || farmer.village;

      const { validateLocationHierarchy } = require("./locations");
      const validation = await validateLocationHierarchy({
        state: updatedState,
        district: updatedDistrict,
        mandal: updatedMandal,
        village: updatedVillage
      });
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      farmer.state = updatedState;
      farmer.district = updatedDistrict;
      farmer.mandal = updatedMandal;
      farmer.village = updatedVillage;
    }

    if (finalFarmerName) {
      farmer.farmerName = finalFarmerName.trim();
      farmer.name = finalFarmerName.trim();
    }
    if (finalLandArea !== undefined) {
      farmer.landArea = String(finalLandArea).trim();
      farmer.landHolding = parseFloat(finalLandArea) || 0;
    }
    if (finalPrimaryCrop) {
      farmer.primaryCrop = String(finalPrimaryCrop).trim();
      farmer.cropType = String(finalPrimaryCrop).trim();
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
        state: farmer.state,
        district: farmer.district,
        mandal: farmer.mandal,
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
    next(error);
  }
});

// GET /api/farmer/crop-requests
router.get("/crop-requests", farmerAuth, async (req, res, next) => {
  try {
    const cropSales = await CropSale.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 });
    // Map to include 'price' field for backward compatibility
    const mapped = cropSales.map(s => ({
      ...s.toObject(),
      price: s.expectedPrice // backward-compatibility mapping
    }));
    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// GET /api/farmer/bookings
router.get("/bookings", farmerAuth, async (req, res, next) => {
  try {
    const bookings = await EquipmentBooking.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// GET /api/farmer/orders
router.get("/orders", farmerAuth, async (req, res, next) => {
  try {
    const orders = await ProductBooking.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET /api/farmer/notifications (Farmer targeted notifications)
router.get("/notifications", farmerAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// PUT /api/farmer/notifications/:id/read (Mark single notification as read)
router.put("/notifications/:id/read", farmerAuth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Notification ID format."
      });
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, farmerId: req.farmer.farmerId },
      { read: true, isRead: true },
      { new: true }
    );
    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    res.json({ success: true, data: notif });
  } catch (error) {
    next(error);
  }
});

// PUT /api/farmer/notifications/read-all (Mark all notifications as read)
router.put("/notifications/read-all", farmerAuth, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { farmerId: req.farmer.farmerId, read: false },
      { read: true, isRead: true }
    );
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
