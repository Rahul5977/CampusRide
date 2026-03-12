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

// ---- Route imports ----
import authRoutes from "./routes/auth.routes.js";
import groupRoutes from "./routes/group.routes.js";

// 1. Load environment variables FIRST
dotenv.config();

const app = express();

// 2. Security headers — helmet sets a dozen hardening headers by default.
//    This is cheap, broad protection against XSS, clickjacking, MIME sniffing, etc.
app.use(helmet());

// 3. CORS — restrict to our frontend origin in production.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// 4. Body parsers
app.use(express.json({ limit: "1mb" }));

// 5. Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);

// Health-check endpoint (useful for serverless warm-up pings)
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 6. Global 404 handler — must come after all valid routes
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

// 8. Connect to MongoDB, then start listening
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
