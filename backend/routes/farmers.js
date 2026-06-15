const express = require("express");
const router = express.Router();
const Farmer = require("../models/Farmer");
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");

// 1. Get Farmer Stats (must be before /:id)
router.get("/stats", auth, async (req, res) => {
  try {
    const totalFarmers = await Farmer.countDocuments();
    const uniqueVillages = await Farmer.distinct("village");
    const totalVillages = uniqueVillages.length;

    const landSum = await Farmer.aggregate([
      { $group: { _id: null, total: { $sum: "$landHolding" } } }
    ]);
    const totalLandHolding = landSum.length > 0 ? landSum[0].total : 0;

    const activeFarmers = await Farmer.countDocuments({ status: "Active" });

    res.json({
      success: true,
      data: {
        totalFarmers,
        totalVillages,
        totalLandHolding,
        activeFarmers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get All Farmers (with optional search query)
router.get("/", auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query = {
        $or: [
          { farmerId: searchRegex },
          { name: searchRegex },
          { phone: searchRegex },
          { village: searchRegex }
        ]
      };
    }
    const farmers = await Farmer.find(query).sort({ farmerId: 1 });
    res.json({ success: true, data: farmers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Add Farmer
router.post("/", auth, async (req, res) => {
  try {
    const farmer = new Farmer(req.body);
    await farmer.save();
    
    // Auto generate notification
    try {
      const dateStr = new Date().toLocaleDateString("en-IN");
      const telegramMsg = `🌾 Kalludevakunta FPO\nNew Farmer Registered\n\nName: ${farmer.name}\nVillage: ${farmer.village}\nCrop: ${farmer.cropType}\n\nDate: ${dateStr}`;
      const dashboardMsg = `Farmer ${farmer.name} has been added.`;

      const { triggerNotification } = require("../services/notificationService");
      await triggerNotification({
        title: "New Farmer Registered",
        dashboardMessage: dashboardMsg,
        telegramMessage: telegramMsg,
        type: "farmer",
        priority: "low"
      });
    } catch (err) {
      console.error("Failed to create farmer notification:", err);
    }

    res.status(201).json({ success: true, data: farmer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Get Single Farmer
router.get("/:id", auth, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }
    res.json({ success: true, data: farmer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Update Farmer
router.put("/:id", auth, async (req, res) => {
  try {
    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!farmer) {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }
    res.json({ success: true, data: farmer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Delete Farmer
router.delete("/:id", auth, async (req, res) => {
  try {
    const farmer = await Farmer.findByIdAndDelete(req.params.id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }
    res.json({ success: true, message: "Farmer deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
