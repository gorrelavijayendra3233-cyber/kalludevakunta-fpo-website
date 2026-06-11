require("dotenv").config();

const contactRoutes = require("./routes/contact");
const cropRoutes = require("./routes/crops");
const bookingRoutes = require("./routes/bookings");
const adminRoutes = require("./routes/admin");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://kalludevakunta-fpo-website.vercel.app",
      "https://kalludevakunta-fpo-website-git-main-fieldmind.vercel.app"
    ],
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/contact", contactRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.get("/", (req, res) => {
  res.send("Kalludevakunta FPO Backend Running");
});

const PORT = 5000;

const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ username: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("KDKFPO@2026", 10);
      await Admin.create({
        username: "admin",
        password: hashedPassword,
      });
      console.log("Default admin created");
    }
  } catch (err) {
    console.error("Error seeding default admin:", err);
  }
};

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await seedAdmin();
  })
  .catch((err) => console.log(err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});