require("dotenv").config();

const contactRoutes = require("./routes/contact");
const cropRoutes = require("./routes/crops");
const bookingRoutes = require("./routes/bookings");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/contact", contactRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/bookings", bookingRoutes);
app.get("/", (req, res) => {
  res.send("Kalludevakunta FPO Backend Running");
});

const PORT = 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});