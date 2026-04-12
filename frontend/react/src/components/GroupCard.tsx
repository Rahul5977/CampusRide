/* -----------------------------------------------------------------------
 * GroupCard — rich ride card: status, host, members, schedule, join flow.
 * ----------------------------------------------------------------------- */

import { useState, useEffect, useCallback } from "react";
import type { Group, User, PendingRequest, MemberRef } from "@/types";
import {
  formatDate,
  formatTime,
  formatDateTime,
  membersContain,
  pendingRequestForUser,
  memberUserId,
  creatorIdFromGroup,
  groupStatusBadgeClass,
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
  UserRound,
  Check,
  X,
  Phone,
  Building2,
  GraduationCap,
  BookOpen,
  Hash,
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
  if (typeof u === "string") return `User …${u.slice(-6)}`;
  return "User";
}

function pendingUserId(p: PendingRequest): string {
  return memberUserId(p.userId);
}

function memberDisplayName(m: MemberRef): string {
  if (typeof m === "object" && m?.name) return m.name;
  if (typeof m === "string") return `…${m.slice(-6)}`;
  return "?";
}

function memberAvatar(m: MemberRef): string | undefined {
  if (typeof m === "object" && m?.avatar) return m.avatar;
  return undefined;
}

export default function GroupCard({ group, onJoined }: GroupCardProps) {
  const [joining, setJoining] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const creatorObj =
    typeof group.creator === "object"
      ? (group.creator as Pick<
          User,
          | "_id"
          | "name"
          | "avatar"
          | "email"
          | "phone"
          | "gender"
          | "hostel"
          | "year"
          | "branch"
        >)
      : null;

  const hostId = creatorIdFromGroup(group.creator);
  const isCreator = !!(user && hostId && hostId === user._id);
  const isMember = user ? membersContain(group.members, user._id) : false;
  const hasPending = user
    ? pendingRequestForUser(group.pendingRequests, user._id)
    : false;
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
  const members = group.members ?? [];

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-lg font-semibold text-gray-900 flex items-center gap-1.5">
              <span>{destinationEmoji[group.destination] ?? "📍"}</span>
              {group.destination}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${groupStatusBadgeClass(group.status)}`}
            >
              {group.status}
            </span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                {pendingCount} pending
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
            <span>Host</span>
            {creatorObj?.avatar && (
              <img
                src={creatorObj.avatar}
                alt=""
                className="h-4 w-4 rounded-full inline"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="font-medium text-gray-700">
              {creatorObj?.name ?? "Unknown"}
            </span>
            {creatorObj?.email && (
              <span className="text-gray-400">· {creatorObj.email}</span>
            )}
          </p>
          {(group.transportType ||
            group.trainNumber ||
            group.trainName ||
            group.flightNumber) && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 flex-wrap">
              <Train size={12} className="shrink-0 text-brand" />
              <span>{group.transportType ?? "Train"}</span>
              {group.trainNumber && <span>#{group.trainNumber}</span>}
              {group.trainName && <span>· {group.trainName}</span>}
              {group.flightNumber && <span>· Flight {group.flightNumber}</span>}
            </p>
          )}
        </div>

        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 ${
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

      {creatorObj &&
        (creatorObj.phone ||
          creatorObj.gender ||
          creatorObj.hostel ||
          creatorObj.year ||
          creatorObj.branch) && (
          <div className="rounded-xl bg-gray-50 border border-border/60 px-3 py-2 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-500 uppercase tracking-wide text-[10px]">
              Host profile
            </p>
            <div className="grid gap-1 sm:grid-cols-2">
              {creatorObj.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone size={12} className="text-brand shrink-0" />
                  {creatorObj.phone}
                </p>
              )}
              {creatorObj.gender && (
                <p className="flex items-center gap-1.5">
                  <UserRound size={12} className="text-brand shrink-0" />
                  {creatorObj.gender}
                </p>
              )}
              {creatorObj.hostel && (
                <p className="flex items-center gap-1.5">
                  <Building2 size={12} className="text-brand shrink-0" />
                  {creatorObj.hostel}
                </p>
              )}
              {creatorObj.year && (
                <p className="flex items-center gap-1.5">
                  <GraduationCap size={12} className="text-brand shrink-0" />
                  {creatorObj.year}
                </p>
              )}
              {creatorObj.branch && (
                <p className="flex items-center gap-1.5 sm:col-span-2">
                  <BookOpen size={12} className="text-brand shrink-0" />
                  {creatorObj.branch}
                </p>
              )}
            </div>
          </div>
        )}

      <div className="rounded-xl border border-border/80 bg-white/50 px-3 py-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Users size={12} />
          Members ({members.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const id = memberUserId(m);
            return (
              <div
                key={id}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 pl-1 pr-2 py-1 text-xs text-gray-800 max-w-[160px]"
              >
                {memberAvatar(m) ? (
                  <img
                    src={memberAvatar(m)}
                    alt=""
                    className="h-6 w-6 rounded-md object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-md bg-brand/15 flex items-center justify-center text-[10px] font-bold text-brand shrink-0">
                    {memberDisplayName(m).charAt(0)}
                  </div>
                )}
                <span className="truncate font-medium">{memberDisplayName(m)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-brand shrink-0" />
          <span>{formatDate(group.departureDate)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-brand shrink-0" />
          <span>
            Window {formatTime(group.timeWindowStart)} –{" "}
            {formatTime(group.timeWindowEnd)}
          </span>
        </div>
        {group.campusLeaveTime && group.transportDepartureTime && (
          <div className="flex items-start gap-1.5 sm:col-span-2 text-xs text-gray-500">
            <Navigation size={14} className="text-brand shrink-0 mt-0.5" />
            <span>
              Leave campus ~{formatTime(group.campusLeaveTime)} · Transport ~{" "}
              {formatTime(group.transportDepartureTime)}
            </span>
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
        <div className="flex items-center gap-1.5 sm:col-span-2">
          <MapPin size={14} className="text-brand shrink-0" />
          <span>Meetup: {group.meetupPoint}</span>
        </div>
        {group.createdAt && (
          <div className="flex items-center gap-1.5 sm:col-span-2 text-xs text-gray-400">
            <Hash size={12} />
            Listed {formatDateTime(group.createdAt)}
          </div>
        )}
      </div>

      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isFull ? "bg-red-500" : "bg-brand"
          }`}
          style={{ width: `${(seatsFilled / totalSeats) * 100}%` }}
        />
      </div>

      {isCreator && group.status === "Open" && pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2">
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
                      <div className="text-sm text-gray-800 min-w-0">
                        <p className="font-medium">{displayNameForPending(p)}</p>
                        {p.message ? (
                          <p className="text-xs text-gray-500 truncate">
                            “{p.message}”
                          </p>
                        ) : null}
                      </div>
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
        type="button"
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
          "✓ You're in this ride"
        ) : isCreator ? (
          "You're hosting this ride"
        ) : hasPending ? (
          "Join request pending"
        ) : isFull || group.status !== "Open" ? (
          group.status !== "Open"
            ? `Join closed (${group.status})`
            : "Full"
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <UserPlus size={15} />
            Request to join
          </span>
        )}
      </button>
    </div>
  );
}
