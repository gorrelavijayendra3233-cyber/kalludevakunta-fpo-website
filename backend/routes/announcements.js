const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const auth = require("../middleware/auth"); // Admin auth

// Helper for standardized error messages
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
};

// 1. GET /api/announcements (Public/Farmer/Admin) - Gets published announcements
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find({ published: true }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    handleError(res, error);
  }
});

// 2. GET /api/announcements/admin (Admin only) - Gets all announcements (drafts + published)
router.get("/admin", auth, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    handleError(res, error);
  }
});

// 3. POST /api/announcements (Admin only) - Create announcement
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, category, priority, imageUrl, published } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and Description are required fields."
      });
    }

    const announcement = new Announcement({
      title,
      description,
      category,
      priority,
      imageUrl,
      published
    });

    await announcement.save();

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 4. PUT /api/announcements/:id (Admin only) - Update announcement
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, description, category, priority, imageUrl, published } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    if (title) announcement.title = title;
    if (description) announcement.description = description;
    if (category) announcement.category = category;
    if (priority) announcement.priority = priority;
    if (imageUrl !== undefined) announcement.imageUrl = imageUrl;
    if (published !== undefined) announcement.published = published;

    await announcement.save();

    res.json({
      success: true,
      message: "Announcement updated successfully",
      announcement
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 5. DELETE /api/announcements/:id (Admin only) - Delete announcement
router.delete("/:id", auth, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    res.json({
      success: true,
      message: "Announcement deleted successfully"
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
