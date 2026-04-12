/* -----------------------------------------------------------------------
 * SearchPage — full-text / filter search over open groups (backend).
 * ----------------------------------------------------------------------- */

import { useState, type FormEvent } from "react";
import api from "@/lib/api";
import type { Destination, Group } from "@/types";
import GroupCard from "@/components/GroupCard";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import { Search, Loader2 } from "lucide-react";

const DEST_OPTIONS: Destination[] = [
  "Durg Junction",
  "Raipur Station",
  "Swami Vivekananda Airport",
];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [destination, setDestination] = useState<Destination | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searched, setSearched] = useState(false);

  const runSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const params: Record<string, string> = {};
      if (q.trim()) params.q = q.trim();
      if (destination) params.destination = destination;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const { data } = await api.get("/search/groups", { params });
      setGroups(data.groups ?? []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Search className="text-brand" size={22} />
        Search rides
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Uses the search API: text on train name plus filters.
      </p>

      <form
        onSubmit={runSearch}
        className="rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-3 mb-6"
      >
        <input
          className="input-field"
          placeholder="Search train name / keywords…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="grid sm:grid-cols-3 gap-3">
          <select
            className="input-field"
            value={destination}
            onChange={(e) =>
              setDestination(e.target.value as Destination | "")
            }
          >
            <option value="">Any destination</option>
            {DEST_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input-field"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
          />
          <input
            type="date"
            className="input-field"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Search size={18} />
          )}
          Search
        </button>
      </form>

      {loading ? (
        <Spinner />
      ) : !searched ? (
        <p className="text-sm text-gray-500 text-center py-8">
          Enter keywords or filters and press Search.
        </p>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title="No matches"
          description="Try different keywords or widen the date range."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <GroupCard key={g._id} group={g} onJoined={() => runSearch()} />
          ))}
        </div>
      )}
    </div>
  );
}
