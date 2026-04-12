/* -----------------------------------------------------------------------
 * Simple date/time formatting helpers.
 * Keeps formatting logic out of components.
 * ----------------------------------------------------------------------- */

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
