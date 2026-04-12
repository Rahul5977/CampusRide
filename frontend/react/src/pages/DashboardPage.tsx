/* -----------------------------------------------------------------------
 * DashboardPage — departure board with filters, user context, and errors.
 * ----------------------------------------------------------------------- */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import GroupCard from "@/components/GroupCard";
import CreateRideModal from "@/components/CreateRideModal";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import {
  Plus,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/api";
import type { Destination, Group } from "@/types";
import { toInputDate } from "@/lib/utils";
import { Link } from "react-router-dom";

const DESTINATIONS: (Destination | "All")[] = [
  "All",
  "Durg Junction",
  "Raipur Station",
  "Swami Vivekananda Airport",
];

export default function DashboardPage() {
  const { user, fetchUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tokenProcessed, setTokenProcessed] = useState(false);

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

  const [filterDest, setFilterDest] = useState<Destination | "All">("All");
  const [filterDate, setFilterDate] = useState("");

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params: Record<string, string> = {};
      if (filterDest !== "All") params.destination = filterDest;
      if (filterDate) params.date = filterDate;
      const { data } = await api.get("/groups", { params });
      setGroups(data.groups ?? []);
    } catch (err: unknown) {
      setGroups([]);
      const ax = err as { message?: string; response?: { data?: { message?: string } } };
      setLoadError(
        ax.response?.data?.message ||
          ax.message ||
          "Could not load rides. Check that the API is running and you are logged in.",
      );
    } finally {
      setLoading(false);
    }
  }, [filterDest, filterDate]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28">
      {user && (
        <section className="mt-4 rounded-2xl border border-border bg-linear-to-br from-brand/5 via-surface to-surface p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="h-16 w-16 rounded-2xl ring-2 ring-brand/20 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-brand/15 flex items-center justify-center text-2xl font-bold text-brand shrink-0">
                {user.name?.charAt(0) ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-lg font-bold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 break-all">
                  <Mail size={14} className="shrink-0 text-brand" />
                  {user.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {user.phone && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-border px-2.5 py-1 text-gray-700">
                    <Phone size={12} className="text-brand" />
                    {user.phone}
                  </span>
                )}
                {user.gender && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-border px-2.5 py-1 text-gray-700">
                    {user.gender}
                  </span>
                )}
                {user.hostel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-border px-2.5 py-1 text-gray-700">
                    <Building2 size={12} className="text-brand" />
                    {user.hostel}
                  </span>
                )}
                {user.year && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-border px-2.5 py-1 text-gray-700">
                    <GraduationCap size={12} className="text-brand" />
                    {user.year}
                  </span>
                )}
                {user.branch && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-border px-2.5 py-1 text-gray-700">
                    <BookOpen size={12} className="text-brand" />
                    {user.branch}
                  </span>
                )}
              </div>
              <Link
                to="/profile"
                className="inline-block text-xs font-semibold text-brand hover:underline"
              >
                View & edit full profile →
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="sticky top-14 z-30 glass -mx-4 border-b border-border px-4 py-3 mt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex flex-wrap gap-1.5">
            {DESTINATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setFilterDest(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterDest === d
                    ? "bg-brand text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d === "All" ? "All destinations" : d}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              min={toInputDate(new Date())}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate("")}
                className="text-xs text-brand hover:underline"
              >
                Clear date
              </button>
            )}
            <button
              type="button"
              onClick={() => loadGroups()}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              title="Refresh list"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
        {!loading && !loadError && (
          <p className="text-xs text-gray-500 mt-2">
            Showing <strong>{groups.length}</strong> ride
            {groups.length === 1 ? "" : "s"}
            {filterDest !== "All" ? ` · ${filterDest}` : ""}
            {filterDate ? ` · ${filterDate}` : ""}
          </p>
        )}
      </div>

      {loadError && (
        <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load rides</p>
            <p className="text-red-700/90">{loadError}</p>
            <p className="text-xs mt-1 text-red-600/80">
              API base:{" "}
              <code className="rounded bg-red-100/80 px-1">
                {import.meta.env.VITE_API_URL || "http://localhost:5001"}
              </code>
            </p>
          </div>
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <Spinner />
        ) : groups.length === 0 && !loadError ? (
          <EmptyState
            icon={<Search size={48} />}
            title="No rides found"
            description={
              filterDest !== "All" || filterDate
                ? "Try changing filters, or create a ride for this route."
                : "No open rides match the filters. Create one to get started!"
            }
            action={
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
              >
                <Plus size={16} />
                Create a ride
              </button>
            }
          />
        ) : !loadError ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <GroupCard key={group._id} group={group} onJoined={loadGroups} />
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-xl shadow-brand/30 hover:bg-brand-dark active:scale-95 transition-all sm:hidden"
        aria-label="Create a ride"
      >
        <Plus size={24} />
      </button>

      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-brand/30 hover:bg-brand-dark active:scale-[0.98] transition-all sm:inline-flex"
      >
        <Plus size={18} />
        Create a ride
      </button>

      <CreateRideModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadGroups}
      />
    </div>
  );
}
