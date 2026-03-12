/* -----------------------------------------------------------------------
 * App.tsx — Root component with React Router v6 setup.
 *
 * Route structure:
 *   /              → LoginPage (public)
 *   /dashboard     → DashboardPage (protected — also handles OAuth callback)
 *   /my-rides      → MyRidesPage (protected)
 *   *              → redirect to /
 * ----------------------------------------------------------------------- */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import MyRidesPage from "@/pages/MyRidesPage";
import ProtectedLayout from "@/layouts/ProtectedLayout";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LoginPage />} />

            {/* Protected — all children share Navbar + auth guard */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/my-rides" element={<MyRidesPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
