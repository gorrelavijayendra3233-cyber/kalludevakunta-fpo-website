const express = require("express");
const router = express.Router();
const ProductBooking = require("../models/ProductBooking");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

// helper for error handling
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: error.message || "An unexpected error occurred."
  });
};

// 1. Submit product booking (Public)
router.post("/", async (req, res) => {
  try {
    const { farmerName, phone, productId, quantity, bookingDate } = req.body;

    if (!farmerName || !phone || !productId || !quantity || !bookingDate) {
      return res.status(400).json({
        success: false,
        message: "Farmer Name, Phone, Product ID, Quantity, and Booking Date are required."
      });
    }

    // Fetch product to get price and name
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const totalPrice = product.price * Number(quantity);

    const booking = new ProductBooking({
      farmerName,
      phone,
      productId: product.productId,
      productName: product.name,
      quantity: Number(quantity),
      totalPrice,
      bookingDate
    });

    await booking.save();

    // Auto generate notification
    try {
      const telegramMsg = `📦 New Product Booking\n\nFarmer: ${booking.farmerName}\nProduct: ${booking.productName}\nQuantity: ${booking.quantity}\nTotal Price: ₹${booking.totalPrice}\n\nBooking Date: ${booking.bookingDate}`;
      const dashboardMsg = `Product booking for ${booking.productName} (Qty: ${booking.quantity}) submitted by ${booking.farmerName}.`;

      const { triggerNotification } = require("../services/notificationService");
      await triggerNotification({
        title: "New Product Booking Received",
        dashboardMessage: dashboardMsg,
        telegramMessage: telegramMsg,
        type: "booking",
        priority: "low"
      });
    } catch (err) {
      console.error("Failed to create product booking notification:", err);
    }

    res.status(201).json({
      success: true,
      message: "Product booking submitted successfully.",
      data: booking
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 2. Get All Bookings (Admin only)
router.get("/", auth, async (req, res) => {
  try {
    const bookings = await ProductBooking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    handleError(res, error);
  }
});

// 3. Update Booking Status (Admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    const booking = await ProductBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    res.json({
      success: true,
      message: "Booking status updated successfully.",
      data: booking
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 4. Delete Booking (Admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const booking = await ProductBooking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }
    res.json({
      success: true,
      message: "Booking deleted successfully."
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
