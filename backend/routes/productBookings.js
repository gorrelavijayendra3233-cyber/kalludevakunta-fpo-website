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
    const { productId, quantity, bookingDate, farmerName, phone } = req.body;

    if (!productId || !quantity || !bookingDate || !farmerName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Product ID, Quantity, Booking Date, Farmer Name, and Phone are required."
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
      farmerId: "PUBLIC",
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

    const booking = await ProductBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const oldStatus = booking.status;
    const newStatus = status;

    if (oldStatus !== newStatus) {
      // Find the product related to this booking by its productId
      const product = await Product.findOne({ productId: booking.productId });
      
      if (product) {
        // Transition 1: Not Confirmed -> Confirmed
        if (oldStatus !== "Confirmed" && newStatus === "Confirmed") {
          if (product.stock < booking.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock of ${product.name} to confirm this booking. Available: ${product.stock}, Required: ${booking.quantity}`
            });
          }
          product.stock -= booking.quantity;
        }
        // Transition 2: Confirmed -> Not Confirmed (Pending or Cancelled)
        else if (oldStatus === "Confirmed" && newStatus !== "Confirmed") {
          product.stock += booking.quantity;
        }

        // Auto determine product status
        if (product.stock === 0) {
          product.status = "Out of Stock";
        } else {
          product.status = "In Stock";
        }

        await product.save();

        // Trigger notifications if stock levels become low/out-of-stock
        try {
          const Notification = require("../models/Notification");
          if (product.stock === 0) {
            const telegramMsg = `🚨 Out Of Stock\n\nProduct: ${product.name}\n\nImmediate action required.`;
            const dashboardMsg = `Product ${product.name} is out of stock.`;
            
            const NotificationSettings = require("../models/NotificationSettings");
            let settings = await NotificationSettings.findOne() || { dashboardEnabled: true, telegramEnabled: true };
            
            if (settings.dashboardEnabled) {
              await Notification.create({
                title: "Out Of Stock Alert",
                message: dashboardMsg,
                type: "inventory",
                priority: "high"
              });
            }
            if (settings.telegramEnabled) {
              const { sendTelegramMessage } = require("../services/telegram");
              await sendTelegramMessage(telegramMsg, "inventory");
            }
          } else if (product.stock <= 10 && oldStatus !== "Confirmed" && newStatus === "Confirmed") {
            const telegramMsg = `⚠️ Low Stock Alert\n\nProduct: ${product.name}\n\nRemaining Stock: ${product.stock}`;
            const dashboardMsg = `Product ${product.name} is running low on stock (${product.stock} left).`;
            
            const NotificationSettings = require("../models/NotificationSettings");
            let settings = await NotificationSettings.findOne() || { dashboardEnabled: true, telegramEnabled: true };
            
            if (settings.dashboardEnabled) {
              await Notification.create({
                title: "Low Stock Alert",
                message: dashboardMsg,
                type: "inventory",
                priority: "medium"
              });
            }
            if (settings.telegramEnabled) {
              const { sendTelegramMessage } = require("../services/telegram");
              await sendTelegramMessage(telegramMsg, "inventory");
            }
          }
        } catch (err) {
          console.error("Failed to create product alert notification on status update:", err);
        }
      }
    }

    booking.status = newStatus;
    await booking.save();

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

    // Restore stock if the deleted booking was Confirmed
    if (booking.status === "Confirmed") {
      try {
        const product = await Product.findOne({ productId: booking.productId });
        if (product) {
          product.stock += booking.quantity;
          if (product.stock > 0) {
            product.status = "In Stock";
          }
          await product.save();
        }
      } catch (err) {
        console.error("Failed to restore product stock on booking deletion:", err);
      }
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
