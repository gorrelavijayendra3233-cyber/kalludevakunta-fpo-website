const express = require("express");
const router = express.Router();
const EquipmentBooking = require("../models/EquipmentBooking");
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");
const farmerAuth = require("../middleware/farmerAuth");

router.post("/", farmerAuth, async (req, res) => {
  try {
    const { equipmentName, bookingDate, duration } = req.body;

    if (!equipmentName || !bookingDate) {
      return res.status(400).json({
        success: false,
        message: "Equipment Name and Booking Date are required fields."
      });
    }

    const booking = new EquipmentBooking({
      farmerId: req.farmer.farmerId,
      farmerName: req.farmer.name,
      phone: req.farmer.phone,
      equipmentName,
      bookingDate,
      duration
    });
    await booking.save();

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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const bookings = await EquipmentBooking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id/approve", auth, async (req, res) => {
  try {
    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    
    booking.status = "Approved";
    await booking.save();

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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/:id/reject", auth, async (req, res) => {
  try {
    const { remarks } = req.body;
    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.status = "Rejected";
    if (remarks) {
      booking.adminRemarks = remarks;
    }
    await booking.save();

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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const booking = await EquipmentBooking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, message: "Equipment booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;