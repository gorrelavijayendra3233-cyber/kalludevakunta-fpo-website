const express = require("express");
const router = express.Router();
const CropRequest = require("../models/CropRequest");
const EquipmentBooking = require("../models/EquipmentBooking");
const ProductBooking = require("../models/ProductBooking");
const farmerAuth = require("../middleware/farmerAuth");

// Apply farmerAuth middleware to all endpoints
router.use(farmerAuth);

// 1. Get Farmer Profile
router.get("/profile", async (req, res) => {
  res.json({
    success: true,
    farmer: req.farmer
  });
});

// 2. Get Farmer Crop Requests
router.get("/crop-requests", async (req, res) => {
  try {
    const cropRequests = await CropRequest.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 });
    res.json(cropRequests);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get Farmer Equipment Bookings
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await EquipmentBooking.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Get Farmer Product Orders (Bookings)
router.get("/orders", async (req, res) => {
  try {
    const orders = await ProductBooking.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
