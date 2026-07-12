require("dotenv").config();

const contactRoutes = require("./routes/contact");
const cropRoutes = require("./routes/crops");
const bookingRoutes = require("./routes/bookings");
const adminRoutes = require("./routes/admin");
const farmerRoutes = require("./routes/farmers");
const productRoutes = require("./routes/products");
const analyticsRoutes = require("./routes/analytics");
const notificationRoutes = require("./routes/notifications");
const productBookingRoutes = require("./routes/productBookings");
const equipmentRatesRoutes = require("./routes/equipments");
const farmerAuthRoutes = require("./routes/farmerAuth");
const cropSalesRoutes = require("./routes/cropSales");
const announcementRoutes = require("./routes/announcements");
const marketPriceRoutes = require("./routes/marketPrices");
const documentRoutes = require("./routes/documents");
const reportRoutes = require("./routes/reports");
const auditLogRoutes = require("./routes/auditLogs");
const locationRoutes = require("./routes/locations").router;
const path = require("path");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const Farmer = require("./models/Farmer");
const Product = require("./models/Product");
const bcrypt = require("bcryptjs");

// Security dependencies
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const hpp = require("hpp");

// Custom Express 5 compatible NoSQL Injection Sanitizer
const sanitizeObject = (obj) => {
  if (obj && typeof obj === "object") {
    for (const key in obj) {
      if (key.startsWith("$")) {
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        sanitizeObject(obj[key]);
      }
    }
  }
};

const customMongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) sanitizeObject(req.query);
  next();
};

const app = express();

// 1. Enable Compression
app.use(compression());

// 2. Safe request logging (logs method, path, status, and response time, never sensitive request body fields)
app.use(morgan(":remote-addr - :method :url :status - :response-time ms"));

// 3. Request payload limit (protects against DOS from oversized request bodies)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 4. Sanitize database queries against NoSQL Injection (Express 5 compatible)
app.use(customMongoSanitize);

// 5. HTTP Parameter Pollution protection
app.use(hpp());

// 6. Helmet headers configuration
app.use(
  helmet({
    contentSecurityPolicy: false, // API-only backend (React client handles CSP)
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows React client to fetch static files (uploads)
    referrerPolicy: { policy: "no-referrer" },
    hsts: process.env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
  })
);

// Explicit supplementary security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

// 7. Hardened CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://[::1]:5173",
  "https://kalludevakuntafpcl.in",
  "https://www.kalludevakuntafpcl.in",
  "https://kalludevakunta-fpo-website.vercel.app",
  "https://kalludevakunta-fpo-website-git-main-fieldmind.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.error("CORS REJECTED ORIGIN:", origin);
        return callback(new Error("CORS policy violation: origin not allowed."));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use("/api/contact", contactRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/product-bookings", productBookingRoutes);
app.use("/api/equipments", equipmentRatesRoutes);
app.use("/api/farmer-auth", farmerAuthRoutes);
app.use("/api/farmer", farmerAuthRoutes);
app.use("/api/crop-sales", cropSalesRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/market-prices", marketPriceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/location", locationRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Kalludevakunta FPO Backend Running");
});

const PORT = 5000;

const seedAdmin = async () => {
  try {
    const defaultPassword = "KDKFPO@2026";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const adminsToSeed = ["admin", "bheemaiah", "director"];
    
    for (const username of adminsToSeed) {
      const adminExists = await Admin.findOne({ username });
      if (!adminExists) {
        await Admin.create({
          username,
          password: hashedPassword,
          lastPasswordChange: new Date()
        });
        console.log(`Admin account '${username}' seeded successfully.`);
      }
    }
  } catch (err) {
    console.error("Error seeding default admins:", err);
  }
};

const seedFarmers = async () => {
  try {
    const count = await Farmer.countDocuments();
    if (count === 0) {
      const defaultFarmers = [
        {
          name: "Ramesh Reddy",
          phone: "9848022338",
          state: "Andhra Pradesh",
          village: "Kalludevakunta",
          mandal: "Mantralayam",
          district: "Kurnool",
          cropType: "Paddy",
          landHolding: 5,
          gender: "Male",
          aadhaarLast4: "1234",
          status: "Active"
        },
        {
          name: "Hanumanthu Goud",
          phone: "8985642231",
          state: "Andhra Pradesh",
          village: "Kosigi",
          mandal: "Kosigi",
          district: "Kurnool",
          cropType: "Cotton",
          landHolding: 3.5,
          gender: "Male",
          aadhaarLast4: "5678",
          status: "Active"
        },
        {
          name: "Saraswathi Devi",
          phone: "7093288114",
          state: "Andhra Pradesh",
          village: "Mantralayam",
          mandal: "Mantralayam",
          district: "Kurnool",
          cropType: "Groundnut",
          landHolding: 2.2,
          gender: "Female",
          aadhaarLast4: "9012",
          status: "Active"
        }
      ];

      for (const f of defaultFarmers) {
        await Farmer.create(f);
      }
      console.log("Default farmers seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding default farmers:", err);
  }
};

const seedProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      const defaultProducts = [
        {
          name: "Groundnut Seeds",
          category: "Seeds",
          description: "High-yield groundnut seeds for Kharif and Rabi seasons.",
          unit: "25kg Bag",
          price: 1200,
          stock: 50,
          status: "In Stock",
          imageUrl: ""
        },
        {
          name: "Neem Fertilizer",
          category: "Fertilizers",
          description: "Organic neem-based pest repellent and fertilizer.",
          unit: "50kg Bag",
          price: 350,
          stock: 100,
          status: "In Stock",
          imageUrl: ""
        },
        {
          name: "Organic Compost",
          category: "Fertilizers",
          description: "Well-decomposed organic farm yard manure.",
          unit: "25kg Bag",
          price: 150,
          stock: 0,
          status: "Out of Stock",
          imageUrl: ""
        },
        {
          name: "Cotton Seeds",
          category: "Seeds",
          description: "BT Cotton hybrid seeds with high resistance to pests.",
          unit: "Packet",
          price: 850,
          stock: 40,
          status: "In Stock",
          imageUrl: ""
        },
        {
          name: "Bio-Pesticide",
          category: "Pesticides",
          description: "Ecologically safe botanical extract pesticide.",
          unit: "Liter Bottle",
          price: 450,
          stock: 15,
          status: "In Stock",
          imageUrl: ""
        }
      ];

      for (const p of defaultProducts) {
        await Product.create(p);
      }
      console.log("Default products seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding default products:", err);
  }
};

const seedSettings = async () => {
  try {
    const NotificationSettings = require("./models/NotificationSettings");
    const count = await NotificationSettings.countDocuments();
    if (count === 0) {
      await NotificationSettings.create({
        dashboardEnabled: true,
        telegramEnabled: true
      });
      console.log("Default notification settings seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding default settings:", err);
  }
};

const seedEquipments = async () => {
  try {
    const Equipment = require("./models/Equipment");
    const count = await Equipment.countDocuments();
    if (count === 0) {
      const defaultEquipments = [
        {
          equipmentId: "tractor",
          name: "Tractor",
          description: "Heavy-duty tractor for ploughing, tilling, and transport. Available with operator.",
          rateHour: 350,
          rateDay: 2500,
          available: true
        },
        {
          equipmentId: "harvester",
          name: "Harvester",
          description: "Combined harvester for paddy and wheat. Reduces harvest time significantly.",
          rateHour: 600,
          rateDay: 4000,
          available: true
        },
        {
          equipmentId: "sprayer",
          name: "Sprayer",
          description: "Motorised boom sprayer for large-area pesticide and fertiliser application.",
          rateHour: 150,
          rateDay: 900,
          available: true
        },
        {
          equipmentId: "seeddrill",
          name: "Seed Drill",
          description: "Precision seed drill for uniform row sowing. Saves seeds and improves yield.",
          rateHour: 300,
          rateDay: 2000,
          available: true
        },
        {
          equipmentId: "rotavator",
          name: "Rotavator",
          description: "Rotary tiller attachment for deep soil mixing and seedbed preparation.",
          rateHour: 250,
          rateDay: 1800,
          available: true
        },
        {
          equipmentId: "cultivator",
          name: "Cultivator",
          description: "Inter-row cultivator for weed control and aeration. Lightweight and effective.",
          rateHour: 200,
          rateDay: 1400,
          available: false
        }
      ];

      for (const eq of defaultEquipments) {
        await Equipment.create(eq);
      }
      console.log("Default equipments seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding default equipments:", err);
  }
};

const seedAnnouncements = async () => {
  try {
    const Announcement = require("./models/Announcement");
    const count = await Announcement.countDocuments();
    if (count === 0) {
      const defaultAnnouncements = [
        {
          title: "FPC Farmer Training Program",
          description: "We are organizing a training program on organic farming methods, soil health management, and biological pest control on Saturday at the FPO training center. Lunch will be provided for all participating farmers.",
          category: "Training",
          priority: "high",
          imageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=300",
          published: true
        },
        {
          title: "PM-Kisan Nidhi Scheme Update",
          description: "The 18th installment of the PM-Kisan Samman Nidhi Yojana has been released. Farmers are requested to check their Aadhaar linking and e-KYC status to ensure smooth direct benefit transfer to their bank accounts.",
          category: "Government Schemes",
          priority: "medium",
          imageUrl: "",
          published: true
        },
        {
          title: "Cotton Procurement Prices Peak",
          description: "Cotton prices in Mantralayam APMC market have reached ₹7,800 per quintal today. FPO members are advised to bring clean, dry crop with low moisture content to secure top rates.",
          category: "Market Prices",
          priority: "medium",
          imageUrl: "",
          published: true
        },
        {
          title: "Annual Farmers Meet 2026",
          description: "Kalludevakunta Farmers Producer Company's Annual Farmers Meet will be held on July 10, 2026, at FPO premises. Agriculture scientists will share insights on maximizing yield. All member farmers are cordially invited.",
          category: "Events",
          priority: "high",
          imageUrl: "https://images.unsplash.com/photo-1595273670150-db0d3bf3b7de?auto=format&fit=crop&w=300",
          published: true
        },
        {
          title: "Monsoon Preparedness Notice",
          description: "With monsoon season approaching, farmers are requested to prepare proper drainage channels in fields to prevent waterlogging. FPO seed distribution centers now have stocks of certified high-moisture tolerant seeds.",
          category: "General",
          priority: "low",
          imageUrl: "",
          published: true
        }
      ];

      for (const a of defaultAnnouncements) {
        await Announcement.create(a);
      }
      console.log("Default announcements seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding default announcements:", err);
  }
};

const seedMarketPrices = async () => {
  try {
    const MarketPrice = require("./models/MarketPrice");
    const count = await MarketPrice.countDocuments();
    if (count === 0) {
      const defaultPrices = [
        {
          cropName: "Cotton",
          todayPrice: 7600,
          yesterdayPrice: 7550,
          trend: "up",
          recommendedPrice: 7800
        },
        {
          cropName: "Paddy (Grade A)",
          todayPrice: 2200,
          yesterdayPrice: 2200,
          trend: "stable",
          recommendedPrice: 2350
        },
        {
          cropName: "Groundnut",
          todayPrice: 6800,
          yesterdayPrice: 6900,
          trend: "down",
          recommendedPrice: 7000
        },
        {
          cropName: "Maize",
          todayPrice: 2100,
          yesterdayPrice: 2050,
          trend: "up",
          recommendedPrice: 2200
        }
      ];

      for (const p of defaultPrices) {
        await MarketPrice.create(p);
      }
      console.log("Default market prices seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding default market prices:", err);
  }
};

const seedDocuments = async () => {
  try {
    const Document = require("./models/Document");
    const count = await Document.countDocuments();
    if (count === 0) {
      const defaultDocs = [
        {
          title: "PM Kisan Samman Nidhi Guidelines",
          description: "Official guide and registration steps for PM Kisan Samman Nidhi scheme.",
          category: "Government Schemes",
          fileUrl: "/uploads/pm_kisan_guide.pdf",
          fileName: "pm_kisan_guide.pdf",
          fileSize: "1.45 MB",
          uploadedBy: "Admin"
        },
        {
          title: "Organic Pest Control Manual",
          description: "Comprehensive handbook for implementing natural organic pest repellents.",
          category: "Training Manuals",
          fileUrl: "/uploads/pest_control_manual.pdf",
          fileName: "pest_control_manual.pdf",
          fileSize: "2.80 MB",
          uploadedBy: "Admin"
        },
        {
          title: "BT Cotton Crop Guide 2026",
          description: "Sowing instructions, pest schedules, and yield maximization checklist.",
          category: "Crop Guides",
          fileUrl: "/uploads/bt_cotton_guide.pdf",
          fileName: "bt_cotton_guide.pdf",
          fileSize: "950 KB",
          uploadedBy: "Admin"
        },
        {
          title: "KDKFPCL Share Capital Membership Form",
          description: "Application form to register as a shareholder in Kalludevakunta Farmer Producer Company Limited (KDKFPCL).",
          category: "KDKFPCL Forms",
          fileUrl: "/uploads/fpo_membership_form.pdf",
          fileName: "fpo_membership_form.pdf",
          fileSize: "420 KB",
          uploadedBy: "Admin"
        }
      ];

      const fs = require("fs");
      const path = require("path");
      const uploadDir = path.join(__dirname, "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      for (const doc of defaultDocs) {
        const filePath = path.join(uploadDir, doc.fileName);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, "Mock PDF document content for " + doc.title);
        }
        await Document.create(doc);
      }
      console.log("Default documents seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding default documents:", err);
  }
};

const seedAuditLogs = async () => {
  try {
    const AuditLog = require("./models/AuditLog");
    const count = await AuditLog.countDocuments();
    if (count === 0) {
      const defaultLogs = [
        {
          user: "admin",
          userType: "Admin",
          module: "Settings",
          action: "UPDATE",
          details: "Notification settings updated: enabled telegram dispatch status alerts.",
          ipAddress: "127.0.0.1"
        },
        {
          user: "Ramesh Reddy",
          userType: "Farmer",
          module: "Farmers",
          action: "CREATE",
          details: "New farmer Ramesh Reddy registered successfully via OTP verification.",
          ipAddress: "192.168.1.10"
        },
        {
          user: "admin",
          userType: "Admin",
          module: "Announcements",
          action: "CREATE",
          details: "Published announcement notice: 'FPC Farmer Training Program'.",
          ipAddress: "127.0.0.1"
        },
        {
          user: "Hanumanthu Goud",
          userType: "Farmer",
          module: "Crops",
          action: "CREATE",
          details: "Submitted new selling request for 50 bags of Cotton.",
          ipAddress: "192.168.1.15"
        },
        {
          user: "admin",
          userType: "Admin",
          module: "Crops",
          action: "APPROVE",
          details: "Approved crop selling request for farmer Saraswathi Devi (Groundnut, 30 Bags).",
          ipAddress: "127.0.0.1"
        }
      ];

      for (const log of defaultLogs) {
        await AuditLog.create(log);
      }
      console.log("Default audit logs seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding default audit logs:", err);
  }
};

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await seedAdmin();
    await seedFarmers();
    await seedProducts();
    await seedSettings();
    await seedEquipments();
    await seedAnnouncements();
    await seedMarketPrices();
    await seedDocuments();
    await seedAuditLogs();

    try {
      const Notification = require("./models/Notification");
      await Notification.create({
        title: "Server Startup",
        message: "FPO backend server has started up and connected to MongoDB.",
        type: "system",
        priority: "medium"
      });
    } catch (err) {
      console.error("Failed to create server startup notification:", err);
    }
  })
  .catch((err) => console.log(err));

// Centralized Express Error Handling Middleware
app.use((err, req, res, next) => {
  // Logs detailed error details only on the server
  console.error("Unhandled Server Error:", err);
  
  // Return generic JSON response to clients
  res.status(err.status || 500).json({
    success: false,
    message: "Internal Server Error"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});