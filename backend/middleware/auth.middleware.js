/**
 * middleware/auth.middleware.js
 * ---------------------------------------------------------------------------
 * Stateless JWT authentication guard.
 *
 * Usage:
 *   import { protect } from "../middleware/auth.middleware.js";
 *   router.post("/groups", protect, createGroup);
 *
 * The middleware:
 *   1. Extracts the token from the `Authorization: Bearer <token>` header.
 *   2. Verifies its signature and expiration.
 *   3. Looks up the user in MongoDB to confirm they still exist (handles
 *      account deletion between token issuance and request time).
 *   4. Attaches the user document to `req.user` for downstream handlers.
 *
 * SECURITY NOTES:
 *   • We do NOT accept tokens from cookies or query strings — Bearer header
 *     only. This eliminates a class of CSRF attacks entirely.
 *   • The DB lookup on every request is intentional: if an admin bans a user,
 *     their existing JWT is immediately invalidated at the cost of one indexed
 *     DB read. For a campus-scale app this trade-off is acceptable.
 * ---------------------------------------------------------------------------
 */

import { verifyToken } from "../config/jwt.config.js";
import User from "../models/users.model.js";

export async function protect(req, res, next) {
  try {
    // ---- 1. Extract token ----
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // ---- 2. Verify token ----
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      // Differentiate between expired and invalid for better DX on the frontend
      const message =
        err.name === "TokenExpiredError"
          ? "Token has expired. Please log in again."
          : "Invalid token. Please log in again.";

      return res.status(401).json({ success: false, message });
    }

    // ---- 3. Confirm user still exists ----
    const user = await User.findById(decoded.id).select("-__v");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists.",
      });
    }

    // ---- 4. Attach to request ----
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal authentication error.",
    });
  }
}
