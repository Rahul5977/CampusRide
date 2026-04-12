/**
 * index.js — Application entry point
 * ---------------------------------------------------------------------------
 * Initialisation order matters:
 *   1. dotenv.config()     — load env vars BEFORE anything reads them
 *   2. Security middleware  — helmet, CORS
 *   3. Body parsers
 *   4. Routes
 *   5. Global error handler
 *   6. MongoDB connection → server.listen()
 * ---------------------------------------------------------------------------
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoose from "mongoose";
import ServerlessHttp from "serverless-http";

// ---- Route imports ----
import authRoutes from "./routes/auth.routes.js";
import groupRoutes from "./routes/group.routes.js";
import userRoutes from "./routes/user.routes.js";
import searchRoutes from "./routes/search.routes.js";
import mediaRoutes from "./routes/media.routes.js";

// 1. Load environment variables FIRST
dotenv.config();

const app = express();

// 2. Security headers
app.use(helmet());

// 3. CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// 4. Body parsers
app.use(express.json({ limit: "1mb" }));

// ---------------------------------------------------------------------------
// NEW: Serverless Database Connection Logic
// ---------------------------------------------------------------------------
const connectDB = async () => {
  // If connection is already active, reuse it (crucial for serverless)
  if (mongoose.connection.readyState === 1) {
    return;
  }
  
  try {
    console.log("=> Creating new database connection...");
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10, // Prevents Lambda from overwhelming MongoDB connections
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
};

// Database Middleware: Ensures DB is connected before hitting any route
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Database connection failed." });
  }
});
// ---------------------------------------------------------------------------

// 5. Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/media", mediaRoutes);

// Health-check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 6. Global 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// 7. Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred."
        : err.message,
  });
});

// ---------------------------------------------------------------------------
// 8. Server Execution & Serverless Export
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

// ONLY run app.listen if we are testing locally on our machine
if (process.env.NODE_ENV !== "production") {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Local server running on port ${PORT}`);
    });
  });
}

// Export the wrapped app for AWS Lambda Production
export const handler = ServerlessHttp(app);