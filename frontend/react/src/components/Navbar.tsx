/* -----------------------------------------------------------------------
 * Navbar — navigation, profile entry, and user account summary.
 * ----------------------------------------------------------------------- */

import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Car,
  LayoutDashboard,
  Route,
  LogOut,
  User,
  ChevronDown,
  Search,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/search", label: "Search", icon: Search },
    { to: "/my-rides", label: "My Rides", icon: Route },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 glass border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 font-bold text-brand shrink-0"
        >
          <Car size={22} />
          <span className="hidden sm:inline">Campus Transit</span>
        </Link>

        <nav className="flex items-center gap-0.5 overflow-x-auto max-w-[42vw] sm:max-w-none">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                isActive(link.to)
                  ? "bg-brand/10 text-brand"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <link.icon size={15} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface pl-1 pr-2 py-1 hover:bg-gray-50 transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="h-8 w-8 rounded-lg ring-1 ring-brand/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-sm font-bold text-brand">
                {user?.name?.charAt(0) ?? "?"}
              </div>
            )}
            <div className="hidden md:block text-left max-w-[140px]">
              <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                {user?.name}
              </p>
              <p className="text-[10px] text-gray-500 truncate leading-tight">
                {user?.email}
              </p>
            </div>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {menuOpen && user && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-surface py-2 shadow-xl z-50">
              <div className="px-3 pb-2 border-b border-border mb-2">
                <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 break-all">{user.email}</p>
              </div>
              <div className="px-3 space-y-1.5 text-xs text-gray-600 mb-2">
                {user.phone && (
                  <p>
                    <span className="text-gray-400">Phone</span> · {user.phone}
                  </p>
                )}
                {user.gender && (
                  <p>
                    <span className="text-gray-400">Gender</span> · {user.gender}
                  </p>
                )}
                {user.hostel && (
                  <p>
                    <span className="text-gray-400">Hostel</span> · {user.hostel}
                  </p>
                )}
                {user.year && (
                  <p>
                    <span className="text-gray-400">Year</span> · {user.year}
                  </p>
                )}
                {user.branch && (
                  <p>
                    <span className="text-gray-400">Branch</span> · {user.branch}
                  </p>
                )}
                {!user.phone && (
                  <p className="text-amber-700">Complete profile under Profile.</p>
                )}
              </div>
              <Link
                to="/profile"
                className="block px-3 py-2 text-sm text-brand hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                View full profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
