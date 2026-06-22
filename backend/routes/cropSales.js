const express = require("express");
const router = express.Router();
const CropSale = require("../models/CropSale");
const Notification = require("../models/Notification");
const farmerAuth = require("../middleware/farmerAuth");
const auth = require("../middleware/auth"); // Admin auth middleware

// helper to get start of today/week/month
const getStartDateForPeriod = (period) => {
  const now = new Date();
  if (period === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "week") {
    const start = new Date();
    // Start of the week (7 days ago)
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "month") {
    const start = new Date();
    // Start of the current month
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return null;
};

// 1. POST /api/crop-sales (Farmer submits crop request)
router.post("/", farmerAuth, async (req, res) => {
  try {
    const { cropName, quantity, unit, expectedPrice, description } = req.body;

    if (!cropName || !quantity || !unit || !expectedPrice) {
      return res.status(400).json({
        success: false,
        message: "Crop Name, Quantity, Unit, and Expected Price are required."
      });
    }

    const newSale = new CropSale({
      farmerId: req.farmer.farmerId,
      farmerName: req.farmer.farmerName || req.farmer.name,
      phone: req.farmer.phone,
      village: req.farmer.village,
      cropName,
      quantity: Number(quantity),
      unit,
      expectedPrice: Number(expectedPrice),
      description,
      status: "Pending"
    });

    await newSale.save();

    // Create Admin Notification (farmerId = null means Admin receives it)
    try {
      const adminNotif = new Notification({
        farmerId: null,
        title: "New Crop Request Submitted",
        message: `Farmer ${newSale.farmerName} submitted a request to sell ${newSale.quantity} ${newSale.unit} of ${newSale.cropName} at ₹${newSale.expectedPrice}/unit.`,
        type: "crop",
        priority: "medium",
        isRead: false,
        read: false
      });
      await adminNotif.save();
    } catch (notifErr) {
      console.error("Failed to create admin notification:", notifErr);
    }

    res.status(201).json({
      success: true,
      message: "Crop sale request submitted successfully.",
      data: newSale
    });
  } catch (error) {
    console.error("Create Crop Sale Request Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred submitting crop request."
    });
  }
});

// 2. GET /api/crop-sales/my (Farmer retrieves their own requests)
router.get("/my", farmerAuth, async (req, res) => {
  try {
    const sales = await CropSale.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    console.error("Fetch Farmer Crop Sales Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred retrieving crop requests."
    });
  }
});

// 3. GET /api/crop-sales (Admin retrieves all requests with filters)
router.get("/", auth, async (req, res) => {
  try {
    const { status, period } = req.query;
    const query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (period && period !== "all") {
      const startDate = getStartDateForPeriod(period);
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    const sales = await CropSale.find(query).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    console.error("Fetch Admin Crop Sales Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred retrieving crop sales records."
    });
  }
});

// 4. PUT /api/crop-sales/:id/approve (Admin approves request)
router.put("/:id/approve", auth, async (req, res) => {
  try {
    const sale = await CropSale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Crop sale request not found." });
    }

    sale.status = "Approved";
    sale.approvedAt = Date.now();
    await sale.save();

    // Create targeted Farmer Notification
    try {
      const farmerNotif = new Notification({
        farmerId: sale.farmerId,
        title: "Crop Request Approved",
        message: `Your crop request ${sale.cropSaleId} (${sale.cropName}) has been approved by Kalludevakunta FPO.`,
        type: "crop",
        priority: "medium",
        read: false,
        isRead: false
      });
      await farmerNotif.save();
    } catch (notifErr) {
      console.error("Failed to create farmer notification:", notifErr);
    }

    res.json({
      success: true,
      message: "Crop request approved successfully.",
      data: sale
    });
  } catch (error) {
    console.error("Approve Crop Request Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred approving request."
    });
  }
});

// 5. PUT /api/crop-sales/:id/reject (Admin rejects request)
router.put("/:id/reject", auth, async (req, res) => {
  try {
    const { remarks } = req.body;
    const adminRemarks = remarks || req.body.remarks || req.body.adminRemarks || "No remarks provided.";

    const sale = await CropSale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Crop sale request not found." });
    }

    sale.status = "Rejected";
    sale.adminRemarks = adminRemarks;
    await sale.save();

    // Create targeted Farmer Notification
    try {
      const farmerNotif = new Notification({
        farmerId: sale.farmerId,
        title: "Crop Request Rejected",
        message: `Your crop request ${sale.cropSaleId} (${sale.cropName}) was rejected.\n\nReason: ${adminRemarks}`,
        type: "crop",
        priority: "high",
        read: false,
        isRead: false
      });
      await farmerNotif.save();
    } catch (notifErr) {
      console.error("Failed to create farmer notification:", notifErr);
    }

    res.json({
      success: true,
      message: "Crop request rejected successfully.",
      data: sale
    });
  } catch (error) {
    console.error("Reject Crop Request Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred rejecting request."
    });
  }
});

// 6. PUT /api/crop-sales/:id/complete (Admin marks request as completed)
router.put("/:id/complete", auth, async (req, res) => {
  try {
    const sale = await CropSale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Crop sale request not found." });
    }

    sale.status = "Completed";
    await sale.save();

    // Create targeted Farmer Notification
    try {
      const farmerNotif = new Notification({
        farmerId: sale.farmerId,
        title: "Crop Request Completed",
        message: `Your crop sale process for request ${sale.cropSaleId} (${sale.cropName}) has been completed.`,
        type: "crop",
        priority: "medium",
        read: false,
        isRead: false
      });
      await farmerNotif.save();
    } catch (notifErr) {
      console.error("Failed to create farmer notification:", notifErr);
    }

    res.json({
      success: true,
      message: "Crop request marked as completed.",
      data: sale
    });
  } catch (error) {
    console.error("Complete Crop Request Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred completing request."
    });
  }
});

// 7. DELETE /api/crop-sales/:id (Admin deletes request record)
router.delete("/:id", auth, async (req, res) => {
  try {
    const sale = await CropSale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Crop sale request not found." });
    }
    res.json({ success: true, message: "Crop sale request deleted successfully." });
  } catch (error) {
    console.error("Delete Crop Request Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred deleting request."
    });
  }
});

module.exports = router;
