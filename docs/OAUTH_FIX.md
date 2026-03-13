# OAuth Callback Fix — What Changed

## Problem

After logging in with Google, the backend successfully created the user and signed a JWT, but the frontend redirect wasn't working. The user would return to the login page instead of being redirected to the dashboard.

## Root Causes

1. **Protected route auth gate was blocking the OAuth callback URL**
   - The backend redirects to `/dashboard?token=XYZ`
   - But the `ProtectedLayout` was checking for a user BEFORE the DashboardPage could extract the token
   - Result: Immediate redirect back to `/` (login page)

2. **Token extraction had a stale dependency array**
   - The effect used `[]` which meant `searchParams` was stale
   - If the page reloaded or the token extraction failed, it wouldn't retry

3. **Minor: JWT_SECRET defaulting to "secret"**
   - The backend config was insecure with a hardcoded default
   - This could cause token mismatches

4. **Frontend .env was missing**
   - The API base URL wasn't configured for the correct backend port (5001)

## Fixes Applied

### 1. ProtectedLayout.tsx

✅ Added support for the OAuth callback token

- Now allows `/dashboard?token=XYZ` through the auth gate without requiring an existing user session
- Checks `searchParams.has("token")` to bypass the auth redirect

```tsx
const hasToken = searchParams.has("token");
if (loading && !hasToken) return <Spinner />;
if (!user && !hasToken) return <Navigate to="/" replace />;
```

### 2. DashboardPage.tsx

✅ Fixed token extraction logic

- Replaced stale dependency array `[]` with proper dependencies
- Added `tokenProcessed` state to prevent double-extraction
- Ensures `fetchUser()` is only called once with the extracted token

```tsx
useEffect(() => {
  const token = searchParams.get("token");
  if (token && !tokenProcessed) {
    localStorage.setItem("ct_token", token);
    setSearchParams({}, { replace: true });
    fetchUser();
    setTokenProcessed(true);
  } else if (!token && !tokenProcessed) {
    setTokenProcessed(true);
  }
}, [searchParams, tokenProcessed, setSearchParams, fetchUser]);
```

### 3. LoginPage.tsx

✅ Fixed error display anti-pattern

- Replaced `useState` + `useEffect` (setState in effect) with `useMemo`
- Avoids cascading renders when reading error from URL

```tsx
const error = useMemo(() => searchParams.get("error"), [searchParams]);
```

### 4. backend/config/jwt.config.js

✅ Removed insecure default

- JWT_SECRET no longer defaults to "secret"
- Now fails fast at startup if JWT_SECRET is not in environment variables

### 5. frontend/react/.env

✅ Created missing env file

- Set `VITE_API_URL=http://localhost:5001` to match your backend port
- Now all API calls point to the correct backend instance

## How It Now Works

```
Browser                     Frontend                   Backend
   │                           │                          │
   │ Click "Login..." ─────────────────────────────────────▶ Google OAuth
   │                           │                          │
   │◀─────────────────────────────────────────────────────── redirect to /dashboard?token=XYZ
   │ (backend redirects)       │                          │
   │                           │                          │
   │ Load /dashboard           │                          │
   │─────────────────────────▶ ProtectedLayout checks:    │
   │                           ✓ has ?token=XYZ           │
   │                           ✓ allow through!           │
   │                           │                          │
   │                           DashboardPage runs         │
   │                           ✓ extracts token from URL  │
   │                           ✓ saves to localStorage    │
   │                           ✓ clears URL (safe)        │
   │                           ✓ calls fetchUser()        │
   │                           │                          │
   │                           GET /api/auth/me ─────────▶
   │                           (with Bearer token)        │
   │                           │◀────── user profile ─────
   │                           │                          │
   │◀─ render dashboard ───────│                          │
```

## Testing the Fix

1. **Backend**: Ensure your `.env` has all required variables:

   ```
   JWT_SECRET=<your-secret>
   GOOGLE_CLIENT_ID=<your-id>
   GOOGLE_CLIENT_SECRET=<your-secret>
   GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
   FRONTEND_URL=http://localhost:5173
   PORT=5001
   ```

2. **Frontend**: Run the dev server:

   ```bash
   cd frontend/react
   npm run dev  # runs on localhost:5173
   ```

3. **Test OAuth flow**:
   - Click "Login with Institute Google Account"
   - Complete Google consent screen
   - Should redirect to dashboard automatically ✓
   - If error, check browser console for details

## Key Takeaways

- OAuth callbacks need the redirect URL to be **allowed through** the auth gate
- Token extraction effects must have correct dependencies
- Always provide `.env` files for environment-specific config
- Test the full OAuth flow end-to-end
