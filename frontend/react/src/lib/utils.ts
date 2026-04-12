/* -----------------------------------------------------------------------
 * Simple date/time formatting helpers.
 * Keeps formatting logic out of components.
 * ----------------------------------------------------------------------- */

import type { Group, GroupStatus } from "@/types";

/**
 * Format an ISO date string to a human-friendly date.
 * e.g. "Thu, 15 Mar 2026"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format an ISO date string to a short time.
 * e.g. "4:30 PM"
 */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a date for the HTML date input (YYYY-MM-DD).
 */
export function toInputDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format a date for the HTML time input (HH:MM).
 */
export function toInputTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

/** Normalize a populated or raw member id from a group `members` array. */
export function memberUserId(ref: string | { _id: string }): string {
  return typeof ref === "string" ? ref : ref._id;
}

export function membersContain(
  members: (string | { _id: string })[],
  userId: string,
): boolean {
  return members.some((m) => memberUserId(m) === userId);
}

export function pendingRequestForUser(
  pending: { userId: string | { _id: string } }[] | undefined,
  userId: string,
): boolean {
  if (!pending?.length) return false;
  return pending.some((p) => memberUserId(p.userId) === userId);
}

export function creatorIdFromGroup(creator: Group["creator"]): string | null {
  if (!creator) return null;
  if (typeof creator === "string") return creator;
  if (typeof creator === "object" && "_id" in creator) return creator._id;
  return null;
}

/** e.g. "12 Apr 2026, 4:30 pm" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function groupStatusBadgeClass(status: GroupStatus): string {
  switch (status) {
    case "Open":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
    case "Full":
      return "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
    case "Locked":
    case "Booking":
      return "bg-sky-100 text-sky-900 ring-1 ring-sky-200";
    case "Created":
      return "bg-violet-100 text-violet-900 ring-1 ring-violet-200";
    case "Departed":
    case "Completed":
      return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 ring-1 ring-red-200";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
