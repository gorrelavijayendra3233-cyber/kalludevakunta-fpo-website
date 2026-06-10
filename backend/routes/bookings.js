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

module.exports = router;