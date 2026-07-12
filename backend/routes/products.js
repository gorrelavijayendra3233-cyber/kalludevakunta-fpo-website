const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { logAction } = require("../services/auditLogger");
const asyncHandler = require("../utils/asyncHandler");
const { isValidObjectId } = require("../utils/validators");
const { getAdminUsername } = require("../utils/helpers");
const { STATUS } = require("../utils/constants");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // 1. Double extension check
    const parts = file.originalname.split(".");
    if (parts.length > 2) {
      return cb(new Error("Double extensions are not allowed."));
    }

    // 2. Strict extension check
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Invalid file extension. Only images are allowed."));
    }

    // 3. Strict MIME type check
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file MIME type. Only images are allowed."));
    }

    cb(null, true);
  }
});

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

// 1. Get Product Inventory Stats (Optimized with parallel Promise.all execution)
router.get("/stats", auth, asyncHandler(async (req, res) => {
  const [totalProducts, categories, inStock, outOfStock] = await Promise.all([
    Product.countDocuments(),
    Product.distinct("category"),
    Product.countDocuments({ status: STATUS.IN_STOCK }),
    Product.countDocuments({ status: STATUS.OUT_OF_STOCK })
  ]);

  const totalCategories = categories.length;

  res.json({
    totalProducts,
    totalCategories,
    inStock,
    outOfStock
  });
}));

// 2. Get All Products (with optional search query)
router.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      // Sanitize search query input
      const sanitizedSearch = String(search).replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
      const searchRegex = new RegExp(sanitizedSearch, "i");
      query = {
        $or: [
          { name: searchRegex },
          { productId: searchRegex },
          { category: searchRegex }
        ]
      };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 0;

    let productsQuery = Product.find(query).sort({ productId: 1 }).lean();
    if (limit > 0) {
      productsQuery = productsQuery.skip((page - 1) * limit).limit(limit);
    }

    const [products, total] = await Promise.all([
      productsQuery,
      Product.countDocuments(query)
    ]);

    if (limit > 0) {
      res.setHeader("X-Total-Count", total);
      res.setHeader("X-Total-Pages", Math.ceil(total / limit));
      res.setHeader("X-Page", page);
      res.setHeader("X-Limit", limit);
    }

    res.json(products);
  } catch (error) {
    next(error);
  }
});

// 3. Add Product
router.post("/", auth, async (req, res, next) => {
  try {
    const { name, category, price, stock, status, unit, description, imageUrl } = req.body;

    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, Category, Price, and Stock are required fields."
      });
    }

    // Input Validation
    if (typeof name !== "string" || name.trim() === "" || name.length > 100) {
      return res.status(400).json({ success: false, message: "Product name is required (max 100 characters)." });
    }
    if (typeof category !== "string" || category.trim() === "" || category.length > 50) {
      return res.status(400).json({ success: false, message: "Category is required (max 50 characters)." });
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: "Price must be a positive number." });
    }
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      return res.status(400).json({ success: false, message: "Stock must be a positive integer." });
    }
    if (status && !["In Stock", "Out of Stock"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid product status." });
    }

    // Determine status automatically if not provided or based on stock
    let finalStatus = status;
    if (numStock === 0) {
      finalStatus = "Out of Stock";
    } else if (!finalStatus) {
      finalStatus = "In Stock";
    }

    const product = new Product({
      name: name.trim(),
      category: category.trim(),
      price: numPrice,
      stock: numStock,
      status: finalStatus,
      unit: unit ? String(unit).trim() : "",
      description: description ? String(description).trim() : "",
      imageUrl: imageUrl ? String(imageUrl).trim() : ""
    });

    await product.save();

    const adminUsername = await getAdminUsername(req.admin.id);
    await logAction(adminUsername, "Admin", "Products", "CREATE", `Added product: ${product.name} (Stock: ${product.stock})`, req.ip);

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
    next(error);
  }
});

// 4. Get Single Product
router.get("/:id", async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format."
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// 5. Update Product
router.put("/:id", auth, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format."
      });
    }

    const { name, category, price, stock, status, unit, description, imageUrl } = req.body;

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Input Validation
    if (name !== undefined && (typeof name !== "string" || name.trim() === "" || name.length > 100)) {
      return res.status(400).json({ success: false, message: "Invalid product name." });
    }
    if (category !== undefined && (typeof category !== "string" || category.trim() === "" || category.length > 50)) {
      return res.status(400).json({ success: false, message: "Invalid category." });
    }
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ success: false, message: "Price must be a positive number." });
      }
    }
    if (stock !== undefined) {
      const numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
        return res.status(400).json({ success: false, message: "Stock must be a positive integer." });
      }
    }
    if (status !== undefined && !["In Stock", "Out of Stock"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid product status." });
    }

    // Automatically set status to Out of Stock if stock is 0
    let finalStatus = status;
    if (stock !== undefined && Number(stock) === 0) {
      finalStatus = "Out of Stock";
    } else if (stock !== undefined && Number(stock) > 0 && existingProduct.stock === 0 && (!status || status === "Out of Stock")) {
      finalStatus = "In Stock";
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (finalStatus !== undefined) updateData.status = finalStatus;
    if (unit !== undefined) updateData.unit = String(unit).trim();
    if (description !== undefined) updateData.description = String(description).trim();
    if (imageUrl !== undefined) updateData.imageUrl = String(imageUrl).trim();

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    const adminUsername = await getAdminUsername(req.admin.id);
    await logAction(adminUsername, "Admin", "Products", "UPDATE", `Updated product: ${product.name} (Stock: ${product.stock}, Status: ${product.status})`, req.ip);

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
    next(error);
  }
});

// 6. Delete Product
router.delete("/:id", auth, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format."
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const adminUsername = await getAdminUsername(req.admin.id);
    await logAction(adminUsername, "Admin", "Products", "DELETE", `Deleted product: ${product.name}`, req.ip);

    res.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/products/upload-image (Admin only) - Upload product image
router.post("/upload-image", auth, (req, res, next) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image file provided" });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ success: true, imageUrl });
    } catch (error) {
      next(error);
    }
  });
});

module.exports = router;
