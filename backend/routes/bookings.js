const express = require("express");
const router = express.Router();
const EquipmentBooking = require("../models/EquipmentBooking");
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");

router.post("/", async (req, res) => {
  try {
    const { equipmentName, bookingDate, duration, farmerName, phone } = req.body;

    if (!equipmentName || !bookingDate || !farmerName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Equipment Name, Booking Date, Farmer Name, and Phone are required fields."
      });
    }

    const booking = new EquipmentBooking({
      farmerId: "PUBLIC",
      farmerName,
      phone,
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