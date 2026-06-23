const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Farmer = require("../models/Farmer");
const CropSale = require("../models/CropSale");
const EquipmentBooking = require("../models/EquipmentBooking");
const ProductBooking = require("../models/ProductBooking");
const Contact = require("../models/Contact");
const Equipment = require("../models/Equipment");

// helper for error handling
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: error.message || "An unexpected error occurred."
  });
};

// GET /api/reports - Fetch report dataset with date filtering
router.get("/", auth, async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    let query = {};
    if (startDate || endDate) {
      const dateField = reportType === "farmers" ? "createdAt" : (reportType === "bookings" ? "bookingDate" : "createdAt");
      query[dateField] = {};
      if (startDate) {
        query[dateField].$gte = new Date(startDate);
      }
      if (endDate) {
        // Adjust endDate to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query[dateField].$lte = end;
      }
    }

    let data = [];
    if (reportType === "farmers") {
      data = await Farmer.find(query).sort({ createdAt: -1 });
    } else if (reportType === "crops") {
      data = await CropSale.find(query).sort({ createdAt: -1 });
    } else if (reportType === "bookings") {
      data = await EquipmentBooking.find(query).sort({ createdAt: -1 });
    } else if (reportType === "orders") {
      data = await ProductBooking.find(query).sort({ createdAt: -1 });
    } else if (reportType === "contacts") {
      data = await Contact.find(query).sort({ createdAt: -1 });
    } else if (reportType === "revenue") {
      // Aggregate revenue metrics
      // 1. Product bookings total cost
      const prodQuery = { status: { $in: ["Confirmed", "Delivered"] } };
      if (startDate || endDate) {
        prodQuery.createdAt = {};
        if (startDate) prodQuery.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          prodQuery.createdAt.$lte = end;
        }
      }
      const productOrders = await ProductBooking.find(prodQuery);
      const productRevenue = productOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      // 2. Equipment bookings revenue calculation
      const eqQuery = { status: { $in: ["Approved", "Completed"] } };
      if (startDate || endDate) {
        eqQuery.bookingDate = {};
        if (startDate) eqQuery.bookingDate.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          eqQuery.bookingDate.$lte = end;
        }
      }
      const eqBookings = await EquipmentBooking.find(eqQuery);
      const equipments = await Equipment.find();

      let equipmentRevenue = 0;
      eqBookings.forEach(booking => {
        const eq = equipments.find(e => e.equipmentId === booking.equipmentId);
        if (eq) {
          const durationStr = booking.duration || "1 Hour";
          const hoursMatch = durationStr.match(/(\d+)\s*Hour/i);
          const daysMatch = durationStr.match(/(\d+)\s*Day/i);
          if (daysMatch) {
            equipmentRevenue += parseInt(daysMatch[1], 10) * eq.rateDay;
          } else if (hoursMatch) {
            equipmentRevenue += parseInt(hoursMatch[1], 10) * eq.rateHour;
          } else {
            equipmentRevenue += eq.rateHour; // default
          }
        }
      });

      // 3. Expected Crop Revenue from completed crop sales
      const cropQuery = { status: { $in: ["Approved", "Completed"] } };
      if (startDate || endDate) {
        cropQuery.createdAt = {};
        if (startDate) cropQuery.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          cropQuery.createdAt.$lte = end;
        }
      }
      const cropRequests = await CropSale.find(cropQuery);
      const cropRevenue = cropRequests.reduce((sum, c) => sum + (c.estimatedValue || c.quantity * c.expectedPrice), 0);

      data = [
        { stream: "Product Sales Revenue", revenue: productRevenue },
        { stream: "Equipment Booking Revenue", revenue: equipmentRevenue },
        { stream: "Expected Crop Revenue", revenue: cropRevenue },
        { stream: "Total Platform Revenue", revenue: productRevenue + equipmentRevenue + cropRevenue }
      ];
    } else {
      return res.status(400).json({ success: false, message: "Invalid reportType" });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
