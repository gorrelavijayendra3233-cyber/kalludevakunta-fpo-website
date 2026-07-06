const express = require("express");
const router = express.Router();
const MarketPrice = require("../models/MarketPrice");
const auth = require("../middleware/auth"); // Admin auth
const { logAction } = require("../services/auditLogger");

const getAdminUsername = async (adminId) => {
  try {
    const Admin = require("../models/Admin");
    const adminUser = await Admin.findById(adminId);
    return adminUser ? adminUser.username : "admin";
  } catch (err) {
    return "admin";
  }
};

// Helper for standardized error messages
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
};

// 1. GET /api/market-prices (Public/Farmer/Admin) - Gets all market prices
router.get("/", async (req, res) => {
  try {
    const prices = await MarketPrice.find().sort({ cropName: 1 });
    res.json(prices);
  } catch (error) {
    handleError(res, error);
  }
});

// 2. PUT /api/market-prices/:id (Admin only) - Update crop prices
router.put("/:id", auth, async (req, res) => {
  try {
    const { todayPrice, recommendedPrice } = req.body;

    const priceRecord = await MarketPrice.findById(req.params.id);
    if (!priceRecord) {
      return res.status(404).json({
        success: false,
        message: "Market price record not found"
      });
    }

    if (todayPrice !== undefined) {
      const newPrice = Number(todayPrice);
      const oldPrice = priceRecord.todayPrice;
      
      priceRecord.yesterdayPrice = oldPrice;
      priceRecord.todayPrice = newPrice;

      if (newPrice > oldPrice) {
        priceRecord.trend = "up";
      } else if (newPrice < oldPrice) {
        priceRecord.trend = "down";
      } else {
        priceRecord.trend = "stable";
      }
    }

    if (recommendedPrice !== undefined) {
      priceRecord.recommendedPrice = Number(recommendedPrice);
    }

    await priceRecord.save();

    const adminUsername = await getAdminUsername(req.admin.id);
    await logAction(adminUsername, "Admin", "Market Prices", "UPDATE", `Updated prices for ${priceRecord.cropName}: todayPrice=${priceRecord.todayPrice}, recommendedPrice=${priceRecord.recommendedPrice}`, req.ip);

    res.json({
      success: true,
      message: "Market prices updated successfully",
      priceRecord
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
