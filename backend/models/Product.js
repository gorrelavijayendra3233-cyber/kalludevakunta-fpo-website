const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    unit: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["In Stock", "Out of Stock"],
      default: "In Stock",
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", async function () {
  if (this.isNew) {
    const lastProduct = await this.constructor.findOne().sort({ productId: -1 });
    let nextIdNumber = 1;
    if (lastProduct && lastProduct.productId) {
      const match = lastProduct.productId.match(/PROD(\d+)/);
      if (match) {
        nextIdNumber = parseInt(match[1], 10) + 1;
      }
    }
    this.productId = `PROD${String(nextIdNumber).padStart(3, "0")}`;
  }
});

module.exports = mongoose.model("Product", productSchema);
