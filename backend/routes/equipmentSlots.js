const express = require("express");
const router = express.Router();
const EquipmentSlot = require("../models/EquipmentSlot");
const auth = require("../middleware/auth");

// Standard error handler
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
};

// 1. Get All Slots (Public or Customer/Admin view)
router.get("/", async (req, res) => {
  try {
    const slots = await EquipmentSlot.find({}).sort({ date: 1, equipmentName: 1 });
    res.json(slots);
  } catch (error) {
    handleError(res, error);
  }
});

// 2. Open Slots for an Equipment on a Day (Admin Only)
router.post("/", auth, async (req, res) => {
  try {
    const { equipmentName, date, slots } = req.body;

    if (!equipmentName || !date || slots === undefined) {
      return res.status(400).json({
        success: false,
        message: "Equipment Name, Date, and Slots count are required."
      });
    }

    // Normalize date format to YYYY-MM-DD
    const datePart = new Date(date).toISOString().split("T")[0];

    // Check if slot configuration already exists
    let existingSlot = await EquipmentSlot.findOne({
      equipmentName: equipmentName.trim(),
      date: datePart
    });

    if (existingSlot) {
      existingSlot.slots = Number(slots);
      await existingSlot.save();
      return res.json({
        success: true,
        message: "Slots capacity updated successfully.",
        data: existingSlot
      });
    }

    const newSlot = new EquipmentSlot({
      equipmentName: equipmentName.trim(),
      date: datePart,
      slots: Number(slots),
      bookedCount: 0
    });

    await newSlot.save();

    res.status(201).json({
      success: true,
      message: "Daily slot opened successfully.",
      data: newSlot
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 3. Delete/Close Slots for a Day (Admin Only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const slot = await EquipmentSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot configuration not found."
      });
    }

    // Check if slot has active bookings
    if (slot.bookedCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot close this slot because active customer bookings exist on this day."
      });
    }

    await EquipmentSlot.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Slot closed/removed successfully."
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
