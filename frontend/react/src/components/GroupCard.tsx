/* -----------------------------------------------------------------------
 * GroupCard — displays a single ride group in a clean card layout.
 *
 * Shows destination, date/time, train number, luggage, gender pref,
 * meetup point, capacity indicator, and a Join button.
 * ----------------------------------------------------------------------- */

import { useState } from "react";
import type { Group, User } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Train,
  Luggage,
  Users,
  ShieldCheck,
  Navigation,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

interface GroupCardProps {
  group: Group;
  onJoined?: () => void;
}

const destinationEmoji: Record<string, string> = {
  "Durg Junction": "🚂",
  "Raipur Station": "🚆",
  "Swami Vivekananda Airport": "✈️",
};

export default function GroupCard({ group, onJoined }: GroupCardProps) {
  const [joining, setJoining] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const isMember = user ? group.members.includes(user._id) : false;
  const isFull = group.currentMembers >= group.capacity;
  const creator =
    typeof group.creator === "object"
      ? (group.creator as Pick<User, "_id" | "name" | "avatar">)
      : null;

  const handleJoin = async () => {
    if (joining || isMember || isFull) return;
    setJoining(true);
    try {
      const { data } = await api.post(`/groups/${group._id}/join`);
      toast({ title: data.message || "Seat claimed!", variant: "success" });
      onJoined?.();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message || "Failed to join. Please try again.";
      toast({ title: msg, variant: "error" });
    } finally {
      setJoining(false);
    }
  };

  const seatsFilled = group.currentMembers;
  const totalSeats = group.capacity;

  return (
    <div className="group rounded-2xl border border-border bg-surface p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header — destination + creator */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-lg font-semibold text-gray-900 flex items-center gap-1.5">
            <span>{destinationEmoji[group.destination] ?? "📍"}</span>
            {group.destination}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <span>by</span>
            {creator?.avatar && (
              <img
                src={creator.avatar}
                alt=""
                className="h-4 w-4 rounded-full inline"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="font-medium text-gray-700">
              {creator?.name ?? "Unknown"}
            </span>
          </p>
        </div>

        {/* Capacity badge */}
        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isFull
              ? "bg-red-100 text-red-700"
              : seatsFilled >= 3
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
          }`}
        >
          <Users size={13} />
          {seatsFilled}/{totalSeats}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-brand shrink-0" />
          <span>{formatDate(group.departureDate)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-brand shrink-0" />
          <span>
            {formatTime(group.timeWindowStart)} –{" "}
            {formatTime(group.timeWindowEnd)}
          </span>
        </div>

        {group.trainNumber && (
          <div className="flex items-center gap-1.5">
            <Train size={14} className="text-brand shrink-0" />
            <span>Train {group.trainNumber}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Luggage size={14} className="text-brand shrink-0" />
          <span>{group.luggage}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-brand shrink-0" />
          <span>{group.genderPreference}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Navigation size={14} className="text-brand shrink-0" />
          <span>{group.meetupPoint}</span>
        </div>
      </div>

      {/* Seat progress bar */}
      <div className="mb-3">
        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isFull ? "bg-red-500" : "bg-brand"
            }`}
            style={{ width: `${(seatsFilled / totalSeats) * 100}%` }}
          />
        </div>
      </div>

      {/* Action */}
      <button
        onClick={handleJoin}
        disabled={joining || isMember || isFull}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
          isMember
            ? "bg-emerald-100 text-emerald-700 cursor-default"
            : isFull
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-brand text-white hover:bg-brand-dark active:scale-[0.98]"
        }`}
      >
        {joining ? (
          <Loader2 size={16} className="mx-auto animate-spin" />
        ) : isMember ? (
          "✓ You're In"
        ) : isFull ? (
          "Cab Full"
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <MapPin size={15} />
            Claim Your Seat
          </span>
        )}
      </button>
    </div>
  );
}
