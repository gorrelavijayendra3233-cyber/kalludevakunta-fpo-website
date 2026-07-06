const express = require("express");
const router = express.Router();
const CropRequest = require("../models/CropRequest");
const auth = require("../middleware/auth");
const farmerAuth = require("../middleware/farmerAuth");
const asyncHandler = require("../utils/asyncHandler");
const { isValidObjectId, isValidPrice, isValidQuantity } = require("../utils/validators");

// POST /api/crops (Farmer submits crop selling request)
router.post("/", farmerAuth, asyncHandler(async (req, res) => {
  const { cropName, quantity, price } = req.body;

  if (!cropName || quantity === undefined || price === undefined) {
    return res.status(400).json({
      success: false,
      message: "Crop Name, Quantity, and Price are required fields."
    });
  }

  if (typeof cropName !== "string" || cropName.trim() === "" || cropName.length > 100) {
    return res.status(400).json({ success: false, message: "Invalid crop name (maximum 100 characters)." });
  }

  if (!isValidQuantity(quantity)) {
    return res.status(400).json({ success: false, message: "Quantity must be a positive number." });
  }

  if (!isValidPrice(price)) {
    return res.status(400).json({ success: false, message: "Price must be a positive number." });
  }

  const crop = new CropRequest({
    farmerId: req.farmer.farmerId,
    farmerName: req.farmer.name,
    phone: req.farmer.phone,
    cropName: cropName.trim(),
    quantity: Number(quantity),
    price: Number(price)
  });
  await crop.save();

  // Auto generate notification
  try {
    const telegramMsg = `🌾 New Crop Request\n\nFarmer: ${crop.farmerName}\nCrop: ${crop.cropName}\nQuantity: ${crop.quantity}`;
    const dashboardMsg = `Crop request for ${crop.cropName} submitted by ${crop.farmerName}.`;

    const { triggerNotification } = require("../services/notificationService");
    await triggerNotification({
      title: "New Crop Request Received",
      dashboardMessage: dashboardMsg,
      telegramMessage: telegramMsg,
      type: "crop",
      priority: "low"
    });
  } catch (err) {
    console.error("Failed to create crop request notification:", err);
  }

  res.status(201).json({
    success: true,
    message: "Crop request saved",
  });
}));

// GET /api/crops (Admin retrieves all crop Requests)
router.get("/", auth, asyncHandler(async (req, res) => {
  const crops = await CropRequest.find().sort({ createdAt: -1 }).lean();
  res.json(crops);
}));

// DELETE /api/crops/:id (Admin deletes a crop request)
router.delete("/:id", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid crop request ID format."
    });
  }

  const crop = await CropRequest.findByIdAndDelete(req.params.id);
  if (!crop) {
    return res.status(404).json({ success: false, message: "Crop request not found" });
  }
  res.json({ success: true, message: "Crop request deleted successfully" });
}));

module.exports = router;