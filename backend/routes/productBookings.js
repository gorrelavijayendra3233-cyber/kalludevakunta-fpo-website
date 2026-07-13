const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ProductBooking = require("../models/ProductBooking");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const { logAction } = require("../services/auditLogger");
const { generalWriteLimiter } = require("../middleware/rateLimiters");

const getAdminUsername = async (adminId) => {
  try {
    const Admin = require("../models/Admin");
    const adminUser = await Admin.findById(adminId);
    return adminUser ? adminUser.username : "admin";
  } catch (err) {
    return "admin";
  }
};

const farmerAuth = require("../middleware/farmerAuth");

// 1. Submit product booking (Protected)
router.post("/", farmerAuth, generalWriteLimiter, async (req, res, next) => {
  try {
    const { productId, quantity, bookingDate } = req.body;

    if (!productId || !quantity || !bookingDate) {
      return res.status(400).json({
        success: false,
        message: "Product ID, Quantity, and Booking Date are required."
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID format."
      });
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0 || !Number.isInteger(numQuantity)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer."
      });
    }

    const parsedDate = Date.parse(bookingDate);
    if (isNaN(parsedDate)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid booking date."
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(parsedDate) < today) {
      return res.status(400).json({
        success: false,
        message: "Booking date cannot be in the past."
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

    if (product.stock <= 0 || product.status === "Out of Stock") {
      return res.status(400).json({
        success: false,
        message: "Product is currently out of stock."
      });
    }

    if (product.stock < numQuantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock. Only ${product.stock} items/bags left.`
      });
    }

    const totalPrice = product.price * numQuantity;

    const booking = new ProductBooking({
      farmerId: req.farmer.farmerId,
      farmerName: req.farmer.name,
      phone: req.farmer.phone,
      productId: product.productId,
      productName: product.name,
      quantity: numQuantity,
      totalPrice,
      bookingDate: new Date(parsedDate)
    });

    await booking.save();

    await logAction(booking.farmerName, "Farmer", "Products", "CREATE", `Ordered product: ${booking.productName} (Quantity: ${booking.quantity}, Total Price: ₹${booking.totalPrice})`, req.ip);

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
    next(error);
  }
});

// 2. Get All Bookings (Admin only)
router.get("/", auth, async (req, res, next) => {
  try {
    const bookings = await ProductBooking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// 3. Update Booking Status (Admin only)
router.put("/:id", auth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product booking ID format."
      });
    }

    const { status } = req.body;
    if (!status || typeof status !== "string") {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    if (!["Pending", "Confirmed", "Cancelled", "Completed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
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

    const adminUsername = await getAdminUsername(req.admin.id);
    await logAction(adminUsername, "Admin", "Products", "UPDATE", `Updated product booking status for ${booking.farmerName} (Product: ${booking.productName}, Quantity: ${booking.quantity}) from ${oldStatus} to ${newStatus}`, req.ip);

    res.json({
      success: true,
      message: "Booking status updated successfully.",
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

// 4. Delete Booking (Admin only)
router.delete("/:id", auth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product booking ID format."
      });
    }

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

    const adminUsername = await getAdminUsername(req.admin.id);
    await logAction(adminUsername, "Admin", "Products", "DELETE", `Deleted product booking for ${booking.farmerName} (Product: ${booking.productName}, Quantity: ${booking.quantity})`, req.ip);

    res.json({
      success: true,
      message: "Booking deleted successfully."
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
