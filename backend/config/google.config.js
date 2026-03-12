/**
 * config/google.config.js
 * ---------------------------------------------------------------------------
 * Centralised Google OAuth2 configuration using `google-auth-library`.
 *
 * WHY google-auth-library instead of Passport.js?
 *   • Passport's GoogleStrategy relies on express-session for the OAuth state
 *     parameter, which violates the "stateless / serverless-ready" constraint.
 *   • google-auth-library gives us raw control: we build the consent URL
 *     ourselves and verify the token ourselves — zero session state required.
 *
 * SECURITY NOTES:
 *   1. GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET must never be committed.
 *      They are read from process.env exclusively.
 *   2. The redirect URI must exactly match the one registered in the
 *      Google Cloud Console (including trailing slash differences).
 * ---------------------------------------------------------------------------
 */

import { OAuth2Client } from "google-auth-library";

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL, // e.g. http://localhost:5000/api/auth/google/callback
);

/**
 * Generate the Google consent screen URL.
 *
 * Scopes requested:
 *   • openid  — required for ID-token based flows
 *   • email   — we MUST read the email to enforce the domain restriction
 *   • profile — name + avatar for the user record
 *
 * `access_type: "offline"` is intentionally omitted because we don't need
 * refresh tokens; we only verify the user once and issue our own JWT.
 *
 * `prompt: "consent"` ensures the consent screen is always shown, preventing
 * silent sign-in from cached browser sessions (extra safety for shared campus
 * computers).
 */
export function getGoogleAuthURL() {
  return oAuth2Client.generateAuthUrl({
    access_type: "online",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    prompt: "consent",
  });
}

/**
 * Exchange the authorisation code for tokens, then verify the ID token.
 *
 * Returns the full decoded payload which contains:
 *   sub, email, email_verified, hd, name, picture, …
 */
export async function getGoogleUser(code) {
  // Exchange authorisation code → { access_token, id_token, … }
  const { tokens } = await oAuth2Client.getToken(code);

  // Verify the id_token's signature and audience claim.
  // This is cryptographically verified against Google's public keys —
  // it cannot be forged.
  const ticket = await oAuth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  return ticket.getPayload(); // { sub, email, hd, name, picture, … }
}
