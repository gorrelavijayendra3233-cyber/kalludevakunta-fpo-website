const express = require("express");
const router = express.Router();

const CropRequest = require("../models/CropRequest");

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

module.exports = router;