const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  partNo: {
    type: String,
    required: true,
    unique: true,
  },
  brand: String,
  description: String,
  unit: String,
  stock: {
    type: Number,
    default: 0,
  },
  sellPrice: {
    type: Number,
    default: 0,
  },
  mrp: {
    type: Number,
    default: 0,
  },
  value: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Product", productSchema);
