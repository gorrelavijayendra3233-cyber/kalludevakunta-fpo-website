const express = require("express");
const router = express.Router();
const Farmer = require("../models/Farmer");
const Product = require("../models/Product");
const CropRequest = require("../models/CropRequest");
const EquipmentBooking = require("../models/EquipmentBooking");
const Contact = require("../models/Contact");
const auth = require("../middleware/auth");

// Helper for standardized error messages
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: error.message || "An unexpected error occurred."
  });
};

// Date helper for timeframes
const getTimeframeQuery = (timeframe) => {
  const now = new Date();
  let startDate;

  if (timeframe === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (timeframe === "week") {
    const day = now.getDay();
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  } else if (timeframe === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (timeframe === "year") {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    return {}; // All time
  }

  return { createdAt: { $gte: startDate } };
};

// 1. GET /api/analytics
router.get("/", auth, async (req, res) => {
  try {
    const { timeframe } = req.query;
    const query = getTimeframeQuery(timeframe);

    const [
      totalFarmers,
      totalProducts,
      totalCropRequests,
      totalBookings,
      totalContacts,
      inStockProducts,
      outOfStockProducts
    ] = await Promise.all([
      Farmer.countDocuments(query),
      Product.countDocuments(query),
      CropRequest.countDocuments(query),
      EquipmentBooking.countDocuments(query),
      Contact.countDocuments(query),
      Product.countDocuments({ ...query, status: "In Stock" }),
      Product.countDocuments({ ...query, status: "Out of Stock" })
    ]);

    res.json({
      totalFarmers,
      totalProducts,
      totalCropRequests,
      totalBookings,
      totalContacts,
      inStockProducts,
      outOfStockProducts
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 2. GET /api/analytics/dashboard
router.get("/dashboard", auth, async (req, res) => {
  try {
    const [
      totalFarmers,
      totalProducts,
      totalCropRequests,
      totalBookings,
      totalContacts,
      inStockProducts,
      outOfStockProducts
    ] = await Promise.all([
      Farmer.countDocuments(),
      Product.countDocuments(),
      CropRequest.countDocuments(),
      EquipmentBooking.countDocuments(),
      Contact.countDocuments(),
      Product.countDocuments({ status: "In Stock" }),
      Product.countDocuments({ status: "Out of Stock" })
    ]);

    res.json({
      totalFarmers,
      totalProducts,
      totalCropRequests,
      totalBookings,
      totalContacts,
      inStockProducts,
      outOfStockProducts
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 3. GET /api/analytics/monthly
router.get("/monthly", auth, async (req, res) => {
  try {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const result = [];

    // Generate past 6 months structure
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        month: months[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth() + 1,
        farmers: 0,
        products: 0,
        bookings: 0
      });
    }

    // Dynamic aggregation pipelines
    const [farmerStats, productStats, bookingStats] = await Promise.all([
      Farmer.aggregate([
        {
          $project: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          }
        },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            count: { $sum: 1 }
          }
        }
      ]),
      Product.aggregate([
        {
          $project: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          }
        },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            count: { $sum: 1 }
          }
        }
      ]),
      EquipmentBooking.aggregate([
        {
          $project: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          }
        },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Map counts to relative month items
    result.forEach(item => {
      const fMatch = farmerStats.find(s => s._id.year === item.year && s._id.month === item.monthNum);
      if (fMatch) item.farmers = fMatch.count;

      const pMatch = productStats.find(s => s._id.year === item.year && s._id.month === item.monthNum);
      if (pMatch) item.products = pMatch.count;

      const bMatch = bookingStats.find(s => s._id.year === item.year && s._id.month === item.monthNum);
      if (bMatch) item.bookings = bMatch.count;
    });

    // Remove temporary keys for clean API response
    const formattedResult = result.map(({ month, farmers, products, bookings }) => ({
      month,
      farmers,
      products,
      bookings
    }));

    res.json(formattedResult);
  } catch (error) {
    handleError(res, error);
  }
});

// 4. GET /api/analytics/categories
router.get("/categories", auth, async (req, res) => {
  try {
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const formattedCategories = categoryStats.map(item => ({
      category: item._id || "Uncategorized",
      count: item.count
    }));

    res.json(formattedCategories);
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
