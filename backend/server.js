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

// Test route
app.get("/", (req, res) => {
  res.send("Auto-Mark backend is running!");
});

// Products API
app.use("/api/products", require("./routes/products"));

// Connect to MongoDB once and reuse the connection
let dbConnectionPromise;

function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .catch((error) => {
        dbConnectionPromise = null;
        throw error;
      });
  }

  return dbConnectionPromise;
}

// Ensure MongoDB is connected before handling API requests
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

// Export the Express app for Vercel
module.exports = app;

// Start a local server during development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Auto-Mark backend is running on port ${PORT}`);
  });
}
