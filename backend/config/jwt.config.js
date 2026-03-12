/**
 * config/jwt.config.js
 * ---------------------------------------------------------------------------
 * JWT helper utilities — sign & verify.
 *
 * SECURITY NOTES:
 *   1. JWT_SECRET must be a long, random string (≥ 256-bit entropy).
 *      Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
 *   2. Tokens expire in 7 days by default. Short-lived tokens reduce the
 *      blast radius of a leaked token. For a campus app this is a good
 *      balance between security and UX.
 *   3. The algorithm defaults to HS256, which is symmetric — fine when the
 *      same server both signs and verifies. If you later split into
 *      micro-services, switch to RS256 with a public/private key pair.
 * ---------------------------------------------------------------------------
 */

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  // Fail fast at startup, not at the first request — much easier to debug.
  throw new Error("FATAL: JWT_SECRET is not defined in environment variables.");
}

/**
 * Sign a JWT containing the user's MongoDB _id.
 *
 * We keep the payload intentionally minimal (just `id`) to:
 *   a) Reduce token size (it's sent on every request).
 *   b) Avoid leaking PII if the token is intercepted.
 *
 * Any additional user data should be fetched from DB using the id.
 */
export function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT. Throws if expired, malformed, or tampered.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
