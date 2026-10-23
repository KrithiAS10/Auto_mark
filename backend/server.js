const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// CORS configuration
app.use(
  cors({
    origin: ["https://auto-mark-9uwk.vercel.app", "http://localhost:5173"],
  }),
);

app.use(express.json());

// MongoDB connection management
let dbConnectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from environment variables");
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

// Ensure MongoDB connects before handling API routes
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
  res.status(200).send("Auto-Mark backend is running!");
});

// Products API
app.use("/api/products", require("./routes/products"));

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Handle unexpected errors
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    message: "Internal server error",
  });
});

// Export Express app for Vercel
module.exports = app;

// Start local server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Auto-Mark backend is running on port ${PORT}`);
  });
}
