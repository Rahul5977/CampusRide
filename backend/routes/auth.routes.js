/**
 * routes/auth.routes.js
 * ---------------------------------------------------------------------------
 * Authentication route definitions.
 *
 * Public routes (no token required):
 *   GET /api/auth/google           → Start Google OAuth flow
 *   GET /api/auth/google/callback  → Google redirects here
 *
 * Protected routes (Bearer token required):
 *   GET   /api/auth/me             → Get current user profile
 *   PATCH /api/auth/profile        → Update profile (phone, gender, hostel, year, branch)
 * ---------------------------------------------------------------------------
 */

import express from "express";
import {
  googleLogin,
  googleCallback,
  getMe,
  updateProfile,
} from "../controllers/auth.controllers.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// ---- Public ----
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);

// ---- Protected ----
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);

export default router;
