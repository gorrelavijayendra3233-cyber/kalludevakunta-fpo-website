const express = require("express");
const router = express.Router();
const EquipmentBooking = require("../models/EquipmentBooking");
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");
const farmerAuth = require("../middleware/farmerAuth");
const { logAction } = require("../services/auditLogger");
const { generalWriteLimiter } = require("../middleware/rateLimiters");
const asyncHandler = require("../utils/asyncHandler");
const { isValidObjectId, isValidDate } = require("../utils/validators");
const { getAdminUsername } = require("../utils/helpers");
const { STATUS } = require("../utils/constants");

// POST /api/bookings (Farmer submits machinery booking request)
router.post("/", farmerAuth, generalWriteLimiter, asyncHandler(async (req, res) => {
  const { equipmentName, bookingDate, duration } = req.body;

  if (!equipmentName || !bookingDate) {
    return res.status(400).json({
      success: false,
      message: "Equipment Name and Booking Date are required fields."
    });
  }

  if (typeof equipmentName !== "string" || equipmentName.trim() === "" || equipmentName.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Invalid equipment name (maximum 100 characters)."
    });
  }

  if (!isValidDate(bookingDate)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid booking date."
    });
  }

  const parsedDate = Date.parse(bookingDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(parsedDate) < today) {
    return res.status(400).json({
      success: false,
      message: "Booking date cannot be in the past."
    });
  }

  let numDuration = 1;
  if (duration !== undefined) {
    const cleanDuration = typeof duration === "string" ? duration.trim().split(" ")[0] : duration;
    numDuration = Number(cleanDuration);
    if (isNaN(numDuration) || numDuration <= 0 || !Number.isInteger(numDuration)) {
      return res.status(400).json({
        success: false,
        message: "Duration must be a positive integer number."
      });
    }
  }

  const booking = new EquipmentBooking({
    farmerId: req.farmer.farmerId,
    farmerName: req.farmer.name,
    phone: req.farmer.phone,
    equipmentName: equipmentName.trim(),
    bookingDate: new Date(parsedDate),
    duration: duration || "1 Days"
  });
  await booking.save();

  await logAction(booking.farmerName, "Farmer", "Bookings", "CREATE", `Booked machinery: ${booking.equipmentName} for ${new Date(booking.bookingDate).toLocaleDateString("en-IN")} (Duration: ${booking.duration})`, req.ip);

  // Auto generate notification
  try {
    const dateStr = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");
    const telegramMsg = `🚜 New Equipment Booking\n\nFarmer: ${booking.farmerName}\nEquipment: ${booking.equipmentName}\n\nBooking Date: ${dateStr}`;
    const dashboardMsg = `Equipment booking for ${booking.equipmentName} submitted by ${booking.farmerName}.`;

    const { triggerNotification } = require("../services/notificationService");
    await triggerNotification({
      title: "New Equipment Booking Received",
      dashboardMessage: dashboardMsg,
      telegramMessage: telegramMsg,
      type: "booking",
      priority: "low"
    });
  } catch (err) {
    console.error("Failed to create booking notification:", err);
  }

  res.status(201).json({
    success: true,
    message: "Booking saved",
  });
}));

// GET /api/bookings (Admin retrieves machinery bookings)
router.get("/", auth, asyncHandler(async (req, res) => {
  const bookings = await EquipmentBooking.find().sort({ createdAt: -1 }).lean();
  res.json(bookings);
}));

// PUT /api/bookings/:id/approve (Admin approves machinery booking)
router.put("/:id/approve", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID format."
    });
  }

  const booking = await EquipmentBooking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }
  
  booking.status = STATUS.APPROVED;
  await booking.save();

  const adminUsername = await getAdminUsername(req.admin.id);
  await logAction(adminUsername, "Admin", "Bookings", "APPROVE", `Approved equipment booking for ${booking.farmerName} (Equipment: ${booking.equipmentName}, Date: ${new Date(booking.bookingDate).toLocaleDateString("en-IN")})`, req.ip);

  // Create targeted farmer notification
  try {
    await Notification.create({
      farmerId: booking.farmerId,
      title: "Equipment Booking Approved",
      message: `Your booking request for ${booking.equipmentName} on ${new Date(booking.bookingDate).toLocaleDateString("en-IN")} has been approved.`,
      type: "booking",
      priority: "medium",
      read: false,
      isRead: false
    });
  } catch (err) {
    console.error("Failed to create farmer notification:", err);
  }

  res.json({ success: true, message: "Booking approved successfully", data: booking });
}));

// PUT /api/bookings/:id/reject (Admin rejects machinery booking)
router.put("/:id/reject", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID format."
    });
  }

  const { remarks } = req.body;
  const booking = await EquipmentBooking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  booking.status = STATUS.REJECTED;
  if (remarks) {
    booking.adminRemarks = String(remarks).trim();
  }
  await booking.save();

  const adminUsername = await getAdminUsername(req.admin.id);
  await logAction(adminUsername, "Admin", "Bookings", "REJECT", `Rejected equipment booking for ${booking.farmerName} (Equipment: ${booking.equipmentName}, Date: ${new Date(booking.bookingDate).toLocaleDateString("en-IN")})${remarks ? `. Remarks: ${remarks}` : ""}`, req.ip);

  // Create targeted farmer notification
  try {
    await Notification.create({
      farmerId: booking.farmerId,
      title: "Equipment Booking Rejected",
      message: `Your booking request for ${booking.equipmentName} on ${new Date(booking.bookingDate).toLocaleDateString("en-IN")} was rejected.${remarks ? `\n\nReason: ${remarks}` : ""}`,
      type: "booking",
      priority: "medium",
      read: false,
      isRead: false
    });
  } catch (err) {
    console.error("Failed to create farmer notification:", err);
  }

  res.json({ success: true, message: "Booking rejected successfully", data: booking });
}));

// DELETE /api/bookings/:id (Admin deletes machinery booking)
router.delete("/:id", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID format."
    });
  }

  const booking = await EquipmentBooking.findByIdAndDelete(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }
  const adminUsername = await getAdminUsername(req.admin.id);
  await logAction(adminUsername, "Admin", "Bookings", "DELETE", `Deleted equipment booking for ${booking.farmerName} (Equipment: ${booking.equipmentName})`, req.ip);
  res.json({ success: true, message: "Equipment booking deleted successfully" });
}));

module.exports = router;