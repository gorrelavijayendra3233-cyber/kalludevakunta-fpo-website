const express = require("express");
const router = express.Router();

const EquipmentBooking = require("../models/EquipmentBooking");

router.post("/", async (req, res) => {
  try {
    const booking = new EquipmentBooking(req.body);
    await booking.save();

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

router.get("/", async (req, res) => {
  try {
    const bookings = await EquipmentBooking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
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