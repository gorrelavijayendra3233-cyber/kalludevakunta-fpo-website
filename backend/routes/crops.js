const express = require("express");
const router = express.Router();
const CropRequest = require("../models/CropRequest");
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");
const farmerAuth = require("../middleware/farmerAuth");

router.post("/", farmerAuth, async (req, res) => {
  try {
    const { cropName, quantity, price } = req.body;

    if (!cropName || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: "Crop Name, Quantity, and Price are required fields."
      });
    }

    const crop = new CropRequest({
      farmerId: req.farmer.farmerId,
      farmerName: req.farmer.name,
      phone: req.farmer.phone,
      cropName,
      quantity,
      price
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const crops = await CropRequest.find().sort({ createdAt: -1 });
    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const crop = await CropRequest.findByIdAndDelete(req.params.id);
    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop request not found" });
    }
    res.json({ success: true, message: "Crop request deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;