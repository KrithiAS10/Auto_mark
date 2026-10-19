const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const Product = require("../models/Product");
const { Readable } = require("stream");

dotenv.config();

async function importProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected!");

    const products = [];

    const filePath = path.join(__dirname, "..", "MAHLE.CSV");

    const fileContent = fs
      .readFileSync(filePath, "utf8")
      .replace(/\r\n?/g, "\n");

    Readable.from([fileContent])
      .pipe(
        csv({
          skipLines: 7,
          headers: [
            "serial",
            "partNo",
            "brand",
            "description",
            "unit",
            "stock",
            "sellPrice",
            "mrp",
            "value",
          ],
        }),
      )
      .on("data", (row) => {
        const partNo = row.partNo?.trim();
        const brand = row.brand?.trim();

        // Skip empty rows and report totals
        if (!partNo || !brand || partNo.toLowerCase() === "total:") {
          return;
        }

        products.push({
          partNo,
          brand,
          description: row.description?.trim() || "",
          unit: row.unit?.trim() || "",
          stock: Number(row.stock) || 0,
          sellPrice: Number(row.sellPrice) || 0,
          mrp: Number(row.mrp) || 0,
          value: Number(row.value) || 0,
        });
      })
      .on("end", async () => {
        try {
          if (products.length === 0) {
            console.log("No products found. Check CSV row formatting.");
            return;
          }

          // Update existing products or insert new ones
          const operations = products.map((product) => ({
            updateOne: {
              filter: { partNo: product.partNo },
              update: { $set: product },
              upsert: true,
            },
          }));

          const result = await Product.bulkWrite(operations);

          console.log(`Products processed: ${products.length}`);
          console.log(`Inserted: ${result.upsertedCount}`);
          console.log(`Updated: ${result.modifiedCount}`);
        } catch (error) {
          console.error("Import failed:", error.message);
        } finally {
          await mongoose.disconnect();
        }
      })
      .on("error", async (error) => {
        console.error("CSV error:", error.message);
        await mongoose.disconnect();
      });
  } catch (error) {
    console.error("Import error:", error.message);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

importProducts();
