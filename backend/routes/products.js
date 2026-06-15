const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");

// Helper for standardized error messages
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: error.message || "An unexpected error occurred."
  });
};

// Deduplicated Notification Creator Helper
const createProductNotification = async (product, title, dashboardMessage, telegramMessage, priority) => {
  try {
    const NotificationSettings = require("../models/NotificationSettings");
    let settings = await NotificationSettings.findOne();
    if (!settings) {
      settings = { dashboardEnabled: true, telegramEnabled: true };
    }

    // 1. Handle dashboard notification deduplication and creation
    if (settings.dashboardEnabled) {
      const duplicate = await Notification.findOne({
        type: "inventory",
        title: title,
        message: dashboardMessage,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      if (!duplicate) {
        await Notification.create({
          title,
          message: dashboardMessage,
          type: "inventory",
          priority
        });
      }
    }

    // 2. Handle telegram notification deduplication and sending
    if (settings.telegramEnabled) {
      const NotificationLog = require("../models/NotificationLog");
      const duplicateLog = await NotificationLog.findOne({
        type: "inventory",
        message: telegramMessage,
        status: "Sent",
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!duplicateLog) {
        const { sendTelegramMessage } = require("../services/telegram");
        await sendTelegramMessage(telegramMessage, "inventory");
      }
    }
  } catch (err) {
    console.error("Failed to create product alert notification:", err);
  }
};

// 1. Get Product Inventory Stats (must be registered before GET /:id)
router.get("/stats", auth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const categories = await Product.distinct("category");
    const totalCategories = categories.length;
    const inStock = await Product.countDocuments({ status: "In Stock" });
    const outOfStock = await Product.countDocuments({ status: "Out of Stock" });

    res.json({
      totalProducts,
      totalCategories,
      inStock,
      outOfStock
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 2. Get All Products (with optional search query)
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query = {
        $or: [
          { name: searchRegex },
          { productId: searchRegex },
          { category: searchRegex }
        ]
      };
    }

    const products = await Product.find(query).sort({ productId: 1 });
    res.json(products);
  } catch (error) {
    handleError(res, error);
  }
});

// 3. Add Product
router.post("/", auth, async (req, res) => {
  try {
    const { name, category, price, stock, status } = req.body;

    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, Category, Price, and Stock are required fields."
      });
    }

    // Determine status automatically if not provided or based on stock
    let finalStatus = status;
    if (Number(stock) === 0) {
      finalStatus = "Out of Stock";
    } else if (!finalStatus) {
      finalStatus = "In Stock";
    }

    const productData = {
      ...req.body,
      status: finalStatus
    };

    const product = new Product(productData);
    await product.save();

    // Auto generate inventory notifications
    if (product.stock === 0) {
      const telegramMsg = `🚨 Out Of Stock\n\nProduct: ${product.name}\n\nImmediate action required.`;
      const dashboardMsg = `Product ${product.name} is out of stock.`;
      await createProductNotification(product, "Out Of Stock Alert", dashboardMsg, telegramMsg, "high");
    } else if (product.stock <= 10) {
      const telegramMsg = `⚠️ Low Stock Alert\n\nProduct: ${product.name}\n\nRemaining Stock: ${product.stock}`;
      const dashboardMsg = `Product ${product.name} is running low on stock (${product.stock} left).`;
      await createProductNotification(product, "Low Stock Alert", dashboardMsg, telegramMsg, "medium");
    }

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 4. Get Single Product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    res.json(product);
  } catch (error) {
    handleError(res, error);
  }
});

// 5. Update Product
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, category, price, stock, status } = req.body;

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Automatically set status to Out of Stock if stock is 0
    let finalStatus = status;
    if (stock !== undefined && Number(stock) === 0) {
      finalStatus = "Out of Stock";
    } else if (stock !== undefined && Number(stock) > 0 && existingProduct.stock === 0 && (!status || status === "Out of Stock")) {
      // If stock goes up from 0 and status wasn't explicitly changed, make it In Stock
      finalStatus = "In Stock";
    }

    const updateData = {
      ...req.body,
    };
    if (finalStatus) {
      updateData.status = finalStatus;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Auto generate inventory notifications
    if (product.stock === 0) {
      const telegramMsg = `🚨 Out Of Stock\n\nProduct: ${product.name}\n\nImmediate action required.`;
      const dashboardMsg = `Product ${product.name} is out of stock.`;
      await createProductNotification(product, "Out Of Stock Alert", dashboardMsg, telegramMsg, "high");
    } else if (product.stock <= 10) {
      const telegramMsg = `⚠️ Low Stock Alert\n\nProduct: ${product.name}\n\nRemaining Stock: ${product.stock}`;
      const dashboardMsg = `Product ${product.name} is running low on stock (${product.stock} left).`;
      await createProductNotification(product, "Low Stock Alert", dashboardMsg, telegramMsg, "medium");
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 6. Delete Product
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    res.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
