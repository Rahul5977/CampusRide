/* -----------------------------------------------------------------------
 * GroupCard — displays a single ride group.
 * Join flow: request → creator approves. Creator can manage pending requests.
 * ----------------------------------------------------------------------- */

import { useState, useEffect, useCallback } from "react";
import type { Group, User, PendingRequest } from "@/types";
import {
  formatDate,
  formatTime,
  membersContain,
  pendingRequestForUser,
  memberUserId,
} from "@/lib/utils";
import {
  MapPin,
  Clock,
  Train,
  Luggage,
  Users,
  ShieldCheck,
  Navigation,
  Loader2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Check,
  X,
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

function displayNameForPending(p: PendingRequest): string {
  const u = p.userId;
  if (typeof u === "object" && u?.name) return u.name;
  if (typeof u === "string") return `User ${u.slice(-6)}`;
  return "User";
}

function pendingUserId(p: PendingRequest): string {
  return memberUserId(p.userId);
}

export default function GroupCard({ group, onJoined }: GroupCardProps) {
  const [joining, setJoining] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const creator =
    typeof group.creator === "object"
      ? (group.creator as Pick<User, "_id" | "name" | "avatar">)
      : null;

  const isCreator = !!(user && creator?._id === user._id);
  const isMember = user ? membersContain(group.members, user._id) : false;
  const hasPending = user ? pendingRequestForUser(group.pendingRequests, user._id) : false;
  const isFull = group.currentMembers >= group.capacity;
  const canRequest =
    user &&
    !isMember &&
    !hasPending &&
    !isFull &&
    group.status === "Open" &&
    !isCreator;

  const pendingCount = group.pendingRequests?.length ?? 0;

  const loadDetail = useCallback(async () => {
    if (!isCreator || !requestsOpen) return;
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/groups/${group._id}`);
      if (data.group) setDetailGroup(data.group as Group);
    } catch {
      setDetailGroup(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [group._id, isCreator, requestsOpen]);

  useEffect(() => {
    if (requestsOpen && isCreator) void loadDetail();
  }, [requestsOpen, isCreator, loadDetail]);

  const displayGroup = detailGroup && requestsOpen ? detailGroup : group;

  const handleRequestJoin = async () => {
    if (joining || !canRequest) return;
    setJoining(true);
    try {
      const { data } = await api.post(`/groups/${group._id}/request-join`, {
        message: "",
      });
      toast({
        title: data.message || "Request sent!",
        variant: "success",
      });
      onJoined?.();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast({
        title:
          axiosErr.response?.data?.message ||
          "Could not send request. Try again.",
        variant: "error",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleApprove = async (targetUserId: string) => {
    setActionId(targetUserId);
    try {
      await api.post(`/groups/${group._id}/approve/${targetUserId}`);
      toast({ title: "Member approved.", variant: "success" });
      await loadDetail();
      onJoined?.();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast({
        title: axiosErr.response?.data?.message || "Approval failed.",
        variant: "error",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (targetUserId: string) => {
    setActionId(targetUserId);
    try {
      await api.post(`/groups/${group._id}/reject/${targetUserId}`);
      toast({ title: "Request rejected.", variant: "success" });
      await loadDetail();
      onJoined?.();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast({
        title: axiosErr.response?.data?.message || "Reject failed.",
        variant: "error",
      });
    } finally {
      setActionId(null);
    }
  };

  const seatsFilled = group.currentMembers;
  const totalSeats = group.capacity;

  return (
    <div className="group rounded-2xl border border-border bg-surface p-4 shadow-sm hover:shadow-md transition-shadow">
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
          {(group.transportType || group.trainNumber || group.trainName) && (
            <p className="text-xs text-gray-400 mt-1">
              {group.transportType ?? "Train"}
              {group.trainNumber ? ` · ${group.trainNumber}` : ""}
              {group.trainName ? ` · ${group.trainName}` : ""}
            </p>
          )}
        </div>

        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isFull
              ? "bg-red-100 text-red-700"
              : seatsFilled >= totalSeats - 1
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
          }`}
        >
          <Users size={13} />
          {seatsFilled}/{totalSeats}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 mb-2">
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-brand shrink-0" />
          <span>{formatDate(group.departureDate)}</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
          <Clock size={14} className="text-brand shrink-0" />
          <span>
            Window {formatTime(group.timeWindowStart)} –{" "}
            {formatTime(group.timeWindowEnd)}
          </span>
        </div>
        {group.campusLeaveTime && group.transportDepartureTime && (
          <div className="flex items-center gap-1.5 col-span-2 text-xs text-gray-500">
            Leave campus ~{formatTime(group.campusLeaveTime)} · Transport ~{" "}
            {formatTime(group.transportDepartureTime)}
          </div>
        )}

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

      {isCreator && group.status === "Open" && pendingCount > 0 && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2">
          <button
            type="button"
            onClick={() => setRequestsOpen((o) => !o)}
            className="flex w-full items-center justify-between text-sm font-semibold text-amber-900"
          >
            <span className="flex items-center gap-2">
              <UserPlus size={16} />
              {pendingCount} join request{pendingCount === 1 ? "" : "s"}
            </span>
            {requestsOpen ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>

          {requestsOpen && (
            <div className="mt-3 space-y-2 border-t border-amber-200/80 pt-3">
              {loadingDetail ? (
                <Loader2 size={18} className="animate-spin text-amber-800" />
              ) : (
                (displayGroup.pendingRequests ?? []).map((p) => {
                  const uid = pendingUserId(p);
                  return (
                    <div
                      key={uid}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-2 py-2"
                    >
                      <span className="text-sm text-gray-800">
                        {displayNameForPending(p)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={actionId === uid}
                          onClick={() => handleApprove(uid)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check size={14} />
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={actionId === uid}
                          onClick={() => handleReject(uid)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-300 disabled:opacity-50"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleRequestJoin}
        disabled={joining || !canRequest}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
          isMember
            ? "bg-emerald-100 text-emerald-700 cursor-default"
            : isCreator
              ? "bg-gray-100 text-gray-600 cursor-default"
              : hasPending
                ? "bg-amber-100 text-amber-800 cursor-default"
                : isFull || group.status !== "Open"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-brand text-white hover:bg-brand-dark active:scale-[0.98]"
        }`}
      >
        {joining ? (
          <Loader2 size={16} className="mx-auto animate-spin" />
        ) : isMember ? (
          "✓ You're In"
        ) : isCreator ? (
          "You're hosting"
        ) : hasPending ? (
          "Request sent"
        ) : isFull || group.status !== "Open" ? (
          group.status !== "Open"
            ? `Not accepting requests (${group.status})`
            : "Full"
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <UserPlus size={15} />
            Request to Join
          </span>
        )}
      </button>
    </div>
  );
}
