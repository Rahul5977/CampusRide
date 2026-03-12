/* -----------------------------------------------------------------------
 * MyRidesPage — shows rides the user has created or joined.
 *
 * Two tabs: "Active" (upcoming) and "Past" (departed / cancelled / full).
 * Allows the creator to cancel (delete) a group.
 * ----------------------------------------------------------------------- */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import { formatDate, formatTime } from "@/lib/utils";
import api from "@/lib/api";
import type { Group, User } from "@/types";
import {
  Route,
  Clock,
  Train,
  Users,
  Trash2,
  Loader2,
  MapPin,
  CalendarOff,
} from "lucide-react";

type Tab = "active" | "past";

export default function MyRidesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("active");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Filter to groups this user is a member of
  const myGroups = groups.filter((g) => user && g.members.includes(user._id));

  const now = new Date();
  const active = myGroups.filter(
    (g) =>
      (g.status === "Open" || g.status === "Full") &&
      new Date(g.departureDate) >= now,
  );
  const past = myGroups.filter(
    (g) =>
      g.status === "Departed" ||
      g.status === "Cancelled" ||
      new Date(g.departureDate) < now,
  );

  const displayed = tab === "active" ? active : past;

  const handleDelete = async (groupId: string) => {
    if (!confirm("Are you sure you want to cancel this ride?")) return;
    setDeletingId(groupId);
    try {
      await api.delete(`/groups/${groupId}`);
      toast({ title: "Ride cancelled.", variant: "success" });
      loadGroups();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast({
        title: axiosErr.response?.data?.message || "Failed to cancel ride.",
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Route size={22} className="text-brand" />
        My Rides
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 mb-6">
        {(["active", "past"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-surface text-brand shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "active"
              ? `Active (${active.length})`
              : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={<CalendarOff size={48} />}
          title={tab === "active" ? "No active rides" : "No past rides"}
          description={
            tab === "active"
              ? "Join or create a ride from the Dashboard!"
              : "Your ride history will appear here."
          }
        />
      ) : (
        <div className="space-y-3">
          {displayed.map((g) => {
            const creator =
              typeof g.creator === "object"
                ? (g.creator as Pick<User, "_id" | "name" | "avatar">)
                : null;
            const isCreator = user && creator?._id === user._id;

            return (
              <div
                key={g._id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <MapPin size={15} className="text-brand shrink-0" />
                      {g.destination}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {formatDate(g.departureDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {formatTime(g.timeWindowStart)} –{" "}
                        {formatTime(g.timeWindowEnd)}
                      </span>
                      {g.trainNumber && (
                        <span className="flex items-center gap-1">
                          <Train size={13} />
                          {g.trainNumber}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={13} />
                        {g.currentMembers}/{g.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Status badge + delete button */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        g.status === "Open"
                          ? "bg-emerald-100 text-emerald-700"
                          : g.status === "Full"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {g.status}
                    </span>

                    {isCreator && tab === "active" && (
                      <button
                        onClick={() => handleDelete(g._id)}
                        disabled={deletingId === g._id}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Cancel this ride"
                      >
                        {deletingId === g._id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
