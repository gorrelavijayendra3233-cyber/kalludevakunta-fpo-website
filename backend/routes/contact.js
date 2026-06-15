const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");

router.post("/", async (req, res) => {
  try {
    const contact = new Contact(req.body);

    await contact.save();

    // Auto generate notification
    try {
      const name = contact.fullName || contact.name || "Anonymous";
      const telegramMsg = `📞 New Contact Request\n\nName: ${name}\nPhone: ${contact.phone}`;
      const dashboardMsg = `Inquiry from ${name} submitted.`;

      const { triggerNotification } = require("../services/notificationService");
      await triggerNotification({
        title: "New Contact Request Submitted",
        dashboardMessage: dashboardMsg,
        telegramMessage: telegramMsg,
        type: "contact",
        priority: "low"
      });
    } catch (err) {
      console.error("Failed to create contact notification:", err);
    }

    res.status(201).json({
      success: true,
      message: "Contact saved successfully",
      data: contact,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }
    res.json({ success: true, message: "Contact request deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;