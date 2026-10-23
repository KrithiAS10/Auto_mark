const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// GET: Fetch all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

// POST: Add a product
router.post("/", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error("Failed to add product:", error);

    res.status(400).json({
      message: error.message,
    });
  }
});

module.exports = router;
