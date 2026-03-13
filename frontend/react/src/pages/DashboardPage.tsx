/* -----------------------------------------------------------------------
 * DashboardPage — the main "Departure Board".
 *
 * 1. On mount: checks for ?token= in the URL (OAuth callback), saves it,
 *    cleans the URL, and triggers user fetch.
 * 2. Fetches open groups with optional destination + date filters.
 * 3. Renders a sticky filter bar + a feed of GroupCards.
 * ----------------------------------------------------------------------- */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import GroupCard from "@/components/GroupCard";
import CreateRideModal from "@/components/CreateRideModal";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import { Plus, Search } from "lucide-react";
import api from "@/lib/api";
import type { Destination, Group } from "@/types";
import { toInputDate } from "@/lib/utils";

const DESTINATIONS: (Destination | "All")[] = [
  "All",
  "Durg Junction",
  "Raipur Station",
  "Swami Vivekananda Airport",
];

export default function DashboardPage() {
  const { fetchUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tokenProcessed, setTokenProcessed] = useState(false);

  // ---- OAuth callback token extraction ----
  useEffect(() => {
    const token = searchParams.get("token");
    if (token && !tokenProcessed) {
      localStorage.setItem("ct_token", token);
      // Strip the token from the URL to prevent leakage via Referer header
      setSearchParams({}, { replace: true });
      fetchUser();
      setTokenProcessed(true);
    } else if (!token && !tokenProcessed) {
      // No token in URL, mark as processed
      setTokenProcessed(true);
    }
  }, [searchParams, tokenProcessed, setSearchParams, fetchUser]);

  // ---- Filter state ----
  const [filterDest, setFilterDest] = useState<Destination | "All">("All");
  const [filterDate, setFilterDate] = useState("");

  // ---- Data state ----
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/groups");
      setGroups(data.groups ?? []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // ---- Apply client-side filters ----
  const filtered = groups.filter((g) => {
    if (filterDest !== "All" && g.destination !== filterDest) return false;
    if (filterDate) {
      const groupDate = new Date(g.departureDate).toISOString().split("T")[0];
      if (groupDate !== filterDate) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24">
      {/* ---- Sticky filter bar ---- */}
      <div className="sticky top-14 z-30 glass -mx-4 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Destination pills */}
          <div className="flex flex-wrap gap-1.5">
            {DESTINATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setFilterDest(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterDest === d
                    ? "bg-brand text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d === "All" ? "All Destinations" : d}
              </button>
            ))}
          </div>

          {/* Date filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            min={toInputDate(new Date())}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand/30"
          />

          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="text-xs text-brand hover:underline"
            >
              Clear date
            </button>
          )}
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="mt-4">
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={48} />}
            title="No rides found"
            description={
              filterDest !== "All" || filterDate
                ? "Try changing your filters, or be the first to create a ride!"
                : "No open rides right now. Be the first to create one!"
            }
            action={
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
              >
                <Plus size={16} />
                Create a Ride
              </button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((group) => (
              <GroupCard key={group._id} group={group} onJoined={loadGroups} />
            ))}
          </div>
        )}
      </div>

      {/* ---- FAB — create ride ---- */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-xl shadow-brand/30 hover:bg-brand-dark active:scale-95 transition-all sm:hidden"
        aria-label="Create a ride"
      >
        <Plus size={24} />
      </button>

      {/* Desktop CTA in header area (visible only on sm+) */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-brand/30 hover:bg-brand-dark active:scale-[0.98] transition-all sm:inline-flex"
      >
        <Plus size={18} />
        Create a Ride
      </button>

      {/* ---- Create Ride Modal ---- */}
      <CreateRideModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadGroups}
      />
    </div>
  );
}
