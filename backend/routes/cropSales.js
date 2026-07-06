const express = require("express");
const router = express.Router();
const CropSale = require("../models/CropSale");
const Notification = require("../models/Notification");
const farmerAuth = require("../middleware/farmerAuth");
const auth = require("../middleware/auth");
const { logAction } = require("../services/auditLogger");
const { generalWriteLimiter } = require("../middleware/rateLimiters");
const asyncHandler = require("../utils/asyncHandler");
const { isValidObjectId, isValidPrice, isValidQuantity } = require("../utils/validators");
const { getAdminUsername } = require("../utils/helpers");
const { STATUS } = require("../utils/constants");

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
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "month") {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return null;
};

// 1. POST /api/crop-sales (Farmer submits crop request)
router.post("/", farmerAuth, generalWriteLimiter, asyncHandler(async (req, res) => {
  const { cropName, quantity, unit, expectedPrice, description } = req.body;

  if (!cropName || !quantity || !unit || !expectedPrice) {
    return res.status(400).json({
      success: false,
      message: "Crop Name, Quantity, Unit, and Expected Price are required."
    });
  }

  if (typeof cropName !== "string" || cropName.trim() === "" || cropName.length > 100) {
    return res.status(400).json({ success: false, message: "Invalid crop name (maximum 100 characters)." });
  }

  if (!isValidQuantity(quantity)) {
    return res.status(400).json({ success: false, message: "Quantity must be a positive number." });
  }

  if (typeof unit !== "string" || unit.trim() === "" || unit.length > 50) {
    return res.status(400).json({ success: false, message: "Invalid unit (maximum 50 characters)." });
  }

  if (!isValidPrice(expectedPrice)) {
    return res.status(400).json({ success: false, message: "Expected price must be a positive number." });
  }

  const newSale = new CropSale({
    farmerId: req.farmer.farmerId,
    farmerName: req.farmer.farmerName || req.farmer.name,
    phone: req.farmer.phone,
    village: req.farmer.village,
    cropName: cropName.trim(),
    quantity: Number(quantity),
    unit: unit.trim(),
    expectedPrice: Number(expectedPrice),
    description: description ? String(description).trim() : "",
    status: STATUS.PENDING
  });

  await newSale.save();

  await logAction(newSale.farmerName, "Farmer", "Crops", "CREATE", `Submitted new crop selling request: ${newSale.cropName} (${newSale.quantity} ${newSale.unit}, Expected Price: ₹${newSale.expectedPrice}/unit)`, req.ip);

  // Create Admin Notification
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
}));

// 2. GET /api/crop-sales/my (Farmer retrieves their own requests)
router.get("/my", farmerAuth, asyncHandler(async (req, res) => {
  const sales = await CropSale.find({ farmerId: req.farmer.farmerId }).sort({ createdAt: -1 }).lean();
  res.json(sales);
}));

// 3. GET /api/crop-sales (Admin retrieves all requests with filters and pagination)
router.get("/", auth, asyncHandler(async (req, res) => {
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

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 0;

  let salesQuery = CropSale.find(query).sort({ createdAt: -1 }).lean();
  if (limit > 0) {
    salesQuery = salesQuery.skip((page - 1) * limit).limit(limit);
  }

  const [sales, total] = await Promise.all([
    salesQuery,
    CropSale.countDocuments(query)
  ]);

  if (limit > 0) {
    res.setHeader("X-Total-Count", total);
    res.setHeader("X-Total-Pages", Math.ceil(total / limit));
    res.setHeader("X-Page", page);
    res.setHeader("X-Limit", limit);
  }

  res.json(sales);
}));

// 4. PUT /api/crop-sales/:id/approve (Admin approves request)
router.put("/:id/approve", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid crop sale request ID format."
    });
  }

  const sale = await CropSale.findById(req.params.id);
  if (!sale) {
    return res.status(404).json({ success: false, message: "Crop sale request not found." });
  }

  sale.status = STATUS.APPROVED;
  sale.approvedAt = Date.now();
  await sale.save();

  const adminUsername = await getAdminUsername(req.admin.id);
  await logAction(adminUsername, "Admin", "Crops", "APPROVE", `Approved crop selling request for ${sale.farmerName} (${sale.cropName}, ${sale.quantity} ${sale.unit})`, req.ip);

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
}));

// 5. PUT /api/crop-sales/:id/reject (Admin rejects request)
router.put("/:id/reject", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid crop sale request ID format."
    });
  }

  const { remarks } = req.body;
  const adminRemarks = remarks ? String(remarks).trim() : "No remarks provided.";

  const sale = await CropSale.findById(req.params.id);
  if (!sale) {
    return res.status(404).json({ success: false, message: "Crop sale request not found." });
  }

  sale.status = STATUS.REJECTED;
  sale.adminRemarks = adminRemarks;
  await sale.save();

  const adminUsername = await getAdminUsername(req.admin.id);
  await logAction(adminUsername, "Admin", "Crops", "REJECT", `Rejected crop selling request for ${sale.farmerName} (${sale.cropName}, ${sale.quantity} ${sale.unit}). Remarks: ${adminRemarks}`, req.ip);

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
}));

// 6. PUT /api/crop-sales/:id/complete (Admin marks request as completed)
router.put("/:id/complete", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid crop sale request ID format."
    });
  }

  const sale = await CropSale.findById(req.params.id);
  if (!sale) {
    return res.status(404).json({ success: false, message: "Crop sale request not found." });
  }

  sale.status = STATUS.COMPLETED;
  await sale.save();

  const adminUsername = await getAdminUsername(req.admin.id);
  await logAction(adminUsername, "Admin", "Crops", "UPDATE", `Marked crop selling request for ${sale.farmerName} (${sale.cropName}, ${sale.quantity} ${sale.unit}) as Completed`, req.ip);

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
}));

// 7. DELETE /api/crop-sales/:id (Admin deletes request record)
router.delete("/:id", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid crop sale request ID format."
    });
  }

  const sale = await CropSale.findByIdAndDelete(req.params.id);
  if (!sale) {
    return res.status(404).json({ success: false, message: "Crop sale request not found." });
  }
  const adminUsername = await getAdminUsername(req.admin.id);
  await logAction(adminUsername, "Admin", "Crops", "DELETE", `Deleted crop request record for ${sale.farmerName} (${sale.cropName}, ${sale.quantity} ${sale.unit})`, req.ip);
  res.json({ success: true, message: "Crop sale request deleted successfully." });
}));

module.exports = router;
