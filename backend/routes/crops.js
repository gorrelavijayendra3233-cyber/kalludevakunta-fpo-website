const express = require("express");
const router = express.Router();
const CropRequest = require("../models/CropRequest");
const auth = require("../middleware/auth");

router.post("/", async (req, res) => {
  try {
    const crop = new CropRequest(req.body);
    await crop.save();

    res.status(201).json({
      success: true,
      message: "Crop request saved",
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
    const crops = await CropRequest.find().sort({ createdAt: -1 });
    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const crop = await CropRequest.findByIdAndDelete(req.params.id);
    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop request not found" });
    }
    res.json({ success: true, message: "Crop request deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;