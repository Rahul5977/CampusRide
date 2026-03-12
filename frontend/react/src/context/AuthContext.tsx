/* -----------------------------------------------------------------------
 * AuthContext — lightweight global auth state.
 *
 * Provides:
 *   • user        — the current User object (null if logged out)
 *   • loading     — true while the initial /me fetch is in flight
 *   • login()     — redirects to Google OAuth
 *   • logout()    — clears token + state
 *   • fetchUser() — re-fetches profile (called after onboarding)
 *   • needsOnboarding — true if profile is incomplete
 * ----------------------------------------------------------------------- */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  needsOnboarding: boolean;
  login: () => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("ct_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      localStorage.removeItem("ct_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, check for a token and fetch the user profile
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const logout = () => {
    localStorage.removeItem("ct_token");
    setUser(null);
    window.location.href = "/";
  };

  const needsOnboarding =
    !!user && (!user.phone || !user.gender || !user.hostel);

  return (
    <AuthContext.Provider
      value={{ user, loading, needsOnboarding, login, logout, fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
