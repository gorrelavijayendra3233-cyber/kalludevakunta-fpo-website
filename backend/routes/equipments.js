const express = require("express");
const router = express.Router();
const Equipment = require("../models/Equipment");
const auth = require("../middleware/auth");

// Helper for standardized error messages
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
};

// 1. Get All Equipments (Public)
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query = {
        $or: [
          { name: searchRegex },
          { equipmentId: searchRegex },
          { description: searchRegex }
        ]
      };
    }

    const equipments = await Equipment.find(query).sort({ equipmentId: 1 });
    res.json(equipments);
  } catch (error) {
    handleError(res, error);
  }
});

// 2. Add Equipment Rate (Protected)
router.post("/", auth, async (req, res) => {
  try {
    const { name, rateHour, rateDay, description, available, equipmentId } = req.body;

    if (!name || rateHour === undefined || rateDay === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, Hourly Rate, and Daily Rate are required fields."
      });
    }

    const equipment = new Equipment({
      equipmentId,
      name,
      description,
      rateHour,
      rateDay,
      available: available !== undefined ? available : true
    });

    await equipment.save();

    res.status(201).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 3. Update Equipment Rate (Protected)
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, rateHour, rateDay, description, available } = req.body;

    const existingEquipment = await Equipment.findById(req.params.id);
    if (!existingEquipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found."
      });
    }

    const updateData = {
      name: name !== undefined ? name : existingEquipment.name,
      description: description !== undefined ? description : existingEquipment.description,
      rateHour: rateHour !== undefined ? rateHour : existingEquipment.rateHour,
      rateDay: rateDay !== undefined ? rateDay : existingEquipment.rateDay,
      available: available !== undefined ? available : existingEquipment.available
    };

    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 4. Delete Equipment Rate (Protected)
router.delete("/:id", auth, async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found."
      });
    }
    res.json({
      success: true,
      message: "Equipment rate deleted successfully."
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
