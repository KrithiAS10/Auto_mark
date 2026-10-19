const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

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

    app.listen(5000, () => {
      console.log("Auto-Mark backend is running on http://localhost:5000");
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
  }
}

startServer();
