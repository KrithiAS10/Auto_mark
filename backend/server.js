const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

app.use(
  cors({
    origin: "https://auto-mark-9uwk.vercel.app",
  }),
);
dotenv.config();

const app = express();

// Allow requests from the React frontend
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Auto-Mark backend is running!");
});

// Products API
app.use("/api/products", require("./routes/products"));

// Connect to MongoDB and start the server

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Auto-Mark backend is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
