const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: ["https://auto-mark-9uwk.vercel.app", "http://localhost:5173"],
  }),
);

app.use(express.json());

// Connect to MongoDB
let dbConnectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .catch((error) => {
        dbConnectionPromise = null;
        throw error;
      });
  }

  await dbConnectionPromise;
}

// Ensure database connection before API routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(503).json({
      message: "Database connection failed",
    });
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Auto-Mark backend is running!");
});

// Products API
app.use("/api/products", require("./routes/products"));

// Export for Vercel
module.exports = app;

// Local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Auto-Mark backend is running on port ${PORT}`);
  });
}
