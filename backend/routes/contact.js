const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const auth = require("../middleware/auth");
const { generalWriteLimiter } = require("../middleware/rateLimiters");
const asyncHandler = require("../utils/asyncHandler");
const { isValidPhone, isValidObjectId } = require("../utils/validators");
const { cleanPhone } = require("../utils/helpers");

// POST /api/contact (Public contact request submission)
router.post("/", generalWriteLimiter, asyncHandler(async (req, res) => {
  const { name, fullName, email, phone, village, inquiryType, message } = req.body;

  const finalName = fullName || name;
  if (!finalName || typeof finalName !== "string" || finalName.trim() === "" || finalName.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Name is required and must be under 100 characters."
    });
  }

  const cleanNum = cleanPhone(phone);
  if (!isValidPhone(cleanNum)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid 10-digit phone number."
    });
  }

  if (!message || typeof message !== "string" || message.trim() === "" || message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Message is required and must be under 1000 characters."
    });
  }

  const contact = new Contact({
    name: finalName.trim(),
    fullName: finalName.trim(),
    email: email ? String(email).trim() : "",
    phone: cleanNum,
    village: village ? String(village).trim() : "",
    inquiryType: inquiryType ? String(inquiryType).trim() : "General",
    message: message.trim()
  });

  await contact.save();

  // Auto generate notification
  try {
    const nameVal = contact.fullName || contact.name || "Anonymous";
    const telegramMsg = `📞 New Contact Request\n\nName: ${nameVal}\nPhone: ${contact.phone}`;
    const dashboardMsg = `Inquiry from ${nameVal} submitted.`;

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
}));

// GET /api/contact (Admin retrieves contact requests)
router.get("/", auth, asyncHandler(async (req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
  res.json(contacts);
}));

// DELETE /api/contact/:id (Admin deletes contact request)
router.delete("/:id", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Contact ID format."
    });
  }

  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) {
    return res.status(404).json({ success: false, message: "Contact not found" });
  }
  res.json({ success: true, message: "Contact request deleted successfully" });
}));

module.exports = router;