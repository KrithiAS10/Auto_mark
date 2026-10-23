const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// 1. CORS configuration
const allowedOrigins = [
  "https://auto-mark-9uwk.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 2. Parse JSON requests
app.use(express.json());

// 3. Health check (does not require MongoDB)
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Auto-Mark backend is running!",
  });
});

// 4. MongoDB connection management
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
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      .catch((error) => {
        dbConnectionPromise = null;
        throw error;
      });
  }

  await dbConnectionPromise;
}

// 5. Connect to MongoDB before API requests
app.use("/api", async (req, res, next) => {
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

// 6. Products API routes
app.use("/api/products", require("./routes/products"));

// 7. Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// 8. Handle unexpected errors
app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    message: "Internal server error",
  });
});

// 9. Export for Vercel
module.exports = app;

// 10. Start server locally
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Auto-Mark backend running on port ${PORT}`);
  });
}
