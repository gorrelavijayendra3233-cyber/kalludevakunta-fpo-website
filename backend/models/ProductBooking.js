const mongoose = require("mongoose");

const productBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true
  },
  farmerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  bookingDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Cancelled"],
    default: "Pending"
  }
}, { timestamps: true });

productBookingSchema.pre("save", async function () {
  if (this.isNew) {
    const lastBooking = await this.constructor.findOne().sort({ bookingId: -1 });
    let nextIdNumber = 1;
    if (lastBooking && lastBooking.bookingId) {
      const match = lastBooking.bookingId.match(/PBOOK(\d+)/);
      if (match) {
        nextIdNumber = parseInt(match[1], 10) + 1;
      }
    }
    this.bookingId = `PBOOK${String(nextIdNumber).padStart(3, "0")}`;
  }
});

module.exports = mongoose.model("ProductBooking", productBookingSchema);
