const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["https://auto-mark-9uwk.vercel.app", "http://localhost:5173"],
  }),
);

app.use(express.json());

// Health check: does not require MongoDB
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Auto-Mark backend is running!",
  });
});

// MongoDB connection
let dbConnectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
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

// Database middleware applies to API routes only
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

app.use("/api/products", require("./routes/products"));

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Auto-Mark backend running on port ${PORT}`);
  });
}
