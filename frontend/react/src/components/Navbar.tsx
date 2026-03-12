/* -----------------------------------------------------------------------
 * Navbar — persistent top navigation bar.
 * Shows the app logo, navigation links, and user avatar/logout.
 * ----------------------------------------------------------------------- */

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Car, LayoutDashboard, Route, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/my-rides", label: "My Rides", icon: Route },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 glass border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 font-bold text-brand"
        >
          <Car size={22} />
          <span className="hidden sm:inline">Campus Transit</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "bg-brand/10 text-brand"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <link.icon size={16} />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-3">
          {user?.avatar && (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-7 w-7 rounded-full ring-2 ring-brand/20"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="hidden text-sm font-medium text-gray-700 sm:inline">
            {user?.name?.split(" ")[0]}
          </span>
          <button
            onClick={logout}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
