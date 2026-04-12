/**
 * controllers/auth.controllers.js
 * ---------------------------------------------------------------------------
 * Handles the two legs of the Google OAuth2 flow AND user profile updates.
 *
 * Flow:
 *   GET /api/auth/google           → redirects to Google consent screen
 *   GET /api/auth/google/callback  → Google redirects here with ?code=…
 *     1. Exchange code → id_token
 *     2. **DOMAIN GATE** — reject if hd / email domain ≠ iitbhilai.ac.in
 *     3. Find-or-create user in MongoDB
 *     4. Sign a JWT and redirect to the frontend with the token
 *   GET  /api/auth/me              → return the authenticated user's profile
 *   PATCH /api/auth/profile        → update profile fields (phone, gender, hostel, year, branch)
 *
 * SECURITY NOTES:
 *   • The domain check is performed on the **verified** id_token payload
 *     returned by Google's servers, NOT on a self-reported field. This makes
 *     it impossible for an attacker to spoof their domain.
 *   • The JWT is passed to the frontend via a URL query parameter over the
 *     redirect. In production the frontend URL MUST be HTTPS so the token
 *     is encrypted in transit. The frontend should immediately read the token
 *     from the URL, store it (e.g. in memory or a secure cookie), and
 *     remove it from the address bar to prevent leakage via Referer headers.
 * ---------------------------------------------------------------------------
 */

import { getGoogleAuthURL, getGoogleUser } from "../config/google.config.js";
import { signToken } from "../config/jwt.config.js";
import User from "../models/users.model.js";

// The ONLY allowed email domain — hard-coded, not configurable, to avoid
// accidental misconfiguration opening the app to the public.
const ALLOWED_DOMAIN = "iitbhilai.ac.in";

/**
 * GET /api/auth/google
 * Redirects the browser to Google's OAuth2 consent screen.
 */
export const googleLogin = (_req, res) => {
  const url = getGoogleAuthURL();
  res.redirect(url);
};

/**
 * GET /api/auth/google/callback
 * Called by Google after the user consents (or denies).
 */
export const googleCallback = async (req, res) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const { code } = req.query;

    if (!code) {
      // User denied consent or something went wrong on Google's end
      return res.redirect(
        `${FRONTEND_URL}/login?error=${encodeURIComponent(
          "Google authentication was cancelled or failed.",
        )}`,
      );
    }

    // ---- 1. Exchange authorisation code for user info ----
    const payload = await getGoogleUser(code);

    // ---- 2. DOMAIN GATE ----
    // Google sets the `hd` (hosted domain) claim for Google Workspace
    // accounts. For personal @gmail.com accounts it is absent.
    // We check BOTH `hd` AND the email suffix as a defence-in-depth measure.
    const emailDomain = payload.email?.split("@")[1];

    if (payload.hd !== ALLOWED_DOMAIN || emailDomain !== ALLOWED_DOMAIN) {
      console.warn(
        `[AUTH] Rejected login from non-college email: ${payload.email}`,
      );
      return res.redirect(
        `${FRONTEND_URL}/login?error=${encodeURIComponent(
          "Access restricted to @iitbhilai.ac.in accounts only.",
        )}`,
      );
    }

    // Extra safety: Google should have verified the email, but let's be sure
    if (!payload.email_verified) {
      return res.redirect(
        `${FRONTEND_URL}/login?error=${encodeURIComponent(
          "Your Google email is not verified. Please verify it first.",
        )}`,
      );
    }

    // ---- 3. Find or create the user ----
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture || "",
      });
      console.log(`[AUTH] New user created: ${user.email}`);
    } else {
      // Update avatar & name in case the user changed their Google profile
      user.name = payload.name;
      user.avatar = payload.picture || user.avatar;
      await user.save();
    }

    // ---- 4. Sign JWT & redirect to frontend ----
    const token = signToken(user._id);

    // The frontend reads the token from the URL, stores it, and strips the
    // query string. See SECURITY NOTES at the top of this file.
    return res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
  } catch (error) {
    console.error("[AUTH] Google callback error:", error);
    return res.redirect(
      `${FRONTEND_URL}/login?error=${encodeURIComponent(
        "Authentication failed. Please try again.",
      )}`,
    );
  }
};

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 * Requires the `protect` middleware to run first.
 */
export const getMe = async (req, res) => {
  try {
    // req.user is already populated by the protect middleware
    return res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.error("[AUTH] getMe error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching profile." });
  }
};

/**
 * PATCH /api/auth/profile
 * Update mutable profile fields (phone, gender, hostel).
 * These fields are collected after initial OAuth sign-up.
 * Requires the `protect` middleware to run first.
 */
export const updateProfile = async (req, res) => {
  try {
    // Whitelist only the fields we allow users to update.
    // This prevents mass-assignment attacks (e.g. overwriting `googleId`).
    const allowedFields = ["phone", "gender", "hostel", "year", "branch"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid fields to update." });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true, // Enforce enum constraints from the schema
    }).select("-__v");

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("[AUTH] updateProfile error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error updating profile." });
  }
};
