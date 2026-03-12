/* -----------------------------------------------------------------------
 * ProtectedLayout — wraps all authenticated routes.
 *
 * Responsibilities:
 *   1. If no user + not loading → redirect to login.
 *   2. If user needs onboarding → show OnboardingModal (non-dismissible).
 *   3. Render the Navbar + <Outlet /> for child routes.
 * ----------------------------------------------------------------------- */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import OnboardingModal from "@/components/OnboardingModal";
import Spinner from "@/components/Spinner";

export default function ProtectedLayout() {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) return <Spinner />;

  // Not logged in — bounce to login page
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen">
      <Navbar />
      {needsOnboarding && <OnboardingModal />}
      <main
        className={
          needsOnboarding ? "pointer-events-none opacity-50 blur-sm" : ""
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
