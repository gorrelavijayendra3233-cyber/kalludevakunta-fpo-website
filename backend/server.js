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
const farmerDashboardRoutes = require("./routes/farmer");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const Farmer = require("./models/Farmer");
const Product = require("./models/Product");
const bcrypt = require("bcryptjs");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://kalludevakunta-fpo-website.vercel.app",
  "https://kalludevakunta-fpo-website-git-main-fieldmind.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins to prevent CORS blockages on custom preview URLs, alternative ports, and local network IPs
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

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
app.use("/api/farmer", farmerDashboardRoutes);
app.get("/", (req, res) => {
  res.send("Kalludevakunta FPO Backend Running");
});

const PORT = 5000;

const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ username: "admin" });
    const hashedPassword = await bcrypt.hash("KDKFPO@2026", 10);
    if (!adminExists) {
      await Admin.create({
        username: "admin",
        password: hashedPassword,
      });
      console.log("Default admin created");
    } else {
      adminExists.password = hashedPassword;
      await adminExists.save();
      console.log("Default admin password verified/reset");
    }
  } catch (err) {
    console.error("Error seeding default admin:", err);
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
          imageUrl: "https://images.unsplash.com/photo-1579613832125-5d34a13ffe2a?auto=format&fit=crop&q=80&w=300"
        },
        {
          name: "Neem Fertilizer",
          category: "Fertilizers",
          description: "Organic neem-based pest repellent and fertilizer.",
          unit: "50kg Bag",
          price: 350,
          stock: 100,
          status: "In Stock",
          imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=300"
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

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await seedAdmin();
    await seedFarmers();
    await seedProducts();
    await seedSettings();
    await seedEquipments();

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});