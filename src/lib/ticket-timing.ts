import { prisma } from "@/lib/prisma";

// Shared by the dashboard AI summarizer today, and meant to be reused by
// the future SLA-lite milestone (time-to-resolution / time-in-progress) —
// build this math once rather than twice.
//
// There's no dedicated "resolvedAt"/"assignedAt" column; the activity log
// (see logTicketFieldChange call sites) already records every status and
// assignee change with human-readable values, so we derive timing from the
// *last* relevant log entry instead of adding schema.
export type TicketTimingBucket =
  | { kind: "resolved"; days: number }
  | { kind: "in_progress"; days: number }
  | { kind: "waiting_on_reporter"; days: number }
  | { kind: "unassigned"; days: number }
  | { kind: "cancelled" };

const RESOLVED_STATUS_NAMES = new Set(["Resolved", "Closed"]);
const WAITING_STATUS_NAME = "Waiting on Reporter";

function daysBetween(from: Date, to: Date) {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

type WaitingInterval = { start: Date; end: Date };

// Sum of how much of each closed [start, end) waiting interval overlaps the
// [from, to] window — this is what gets subtracted out of "officer time"
// so a slow-to-reply reporter doesn't count against the officer's SLA.
function overlapDays(intervals: WaitingInterval[], from: Date, to: Date): number {
  let totalMs = 0;
  for (const interval of intervals) {
    const start = Math.max(interval.start.getTime(), from.getTime());
    const end = Math.min(interval.end.getTime(), to.getTime());
    if (end > start) totalMs += end - start;
  }
  return Math.round(totalMs / 86_400_000);
}

export async function getTicketTimingBuckets(
  tickets: { id: string; createdAt: Date; statusName: string; assigneeId: string | null }[],
): Promise<Map<string, TicketTimingBucket>> {
  const now = new Date();
  const ticketIds = tickets.map((t) => t.id);

  const [statusLogs, assigneeLogs] = await Promise.all([
    // Ascending, and every entry (not just the latest) — reconstructing how
    // long a ticket spent in "Waiting on Reporter" needs the full sequence
    // of enter/exit transitions, not just where it is now.
    prisma.activityLog.findMany({
      where: { ticketId: { in: ticketIds }, field: "status" },
      select: { ticketId: true, newValue: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.activityLog.findMany({
      where: { ticketId: { in: ticketIds }, field: "assignee", newValue: { not: null } },
      select: { ticketId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const latestAssignedAt = new Map<string, Date>();
  for (const log of assigneeLogs) {
    if (!latestAssignedAt.has(log.ticketId)) latestAssignedAt.set(log.ticketId, log.createdAt);
  }

  // Walk each ticket's status history forward once to build: (a) every
  // *closed* Waiting-on-Reporter interval, (b) when the *current* wait
  // period started (if the ticket is waiting right now), and (c) when it
  // most recently entered a resolved state.
  type WaitingInfo = {
    closedIntervals: WaitingInterval[];
    openStart: Date | null;
    latestResolvedAt: Date | null;
  };
  const logsByTicket = new Map<string, { newValue: string | null; createdAt: Date }[]>();
  for (const log of statusLogs) {
    const entries = logsByTicket.get(log.ticketId);
    if (entries) entries.push(log);
    else logsByTicket.set(log.ticketId, [log]);
  }

  const waitingInfoByTicket = new Map<string, WaitingInfo>();
  for (const [ticketId, entries] of logsByTicket) {
    let openStart: Date | null = null;
    let latestResolvedAt: Date | null = null;
    const closedIntervals: WaitingInterval[] = [];
    for (const entry of entries) {
      if (entry.newValue === WAITING_STATUS_NAME) {
        if (!openStart) openStart = entry.createdAt;
        continue;
      }
      if (openStart) {
        closedIntervals.push({ start: openStart, end: entry.createdAt });
        openStart = null;
      }
      if (RESOLVED_STATUS_NAMES.has(entry.newValue ?? "")) {
        latestResolvedAt = entry.createdAt;
      }
    }
    waitingInfoByTicket.set(ticketId, { closedIntervals, openStart, latestResolvedAt });
  }

  const buckets = new Map<string, TicketTimingBucket>();
  for (const ticket of tickets) {
    if (ticket.statusName === "Cancelled") {
      buckets.set(ticket.id, { kind: "cancelled" });
      continue;
    }

    const info = waitingInfoByTicket.get(ticket.id) ?? {
      closedIntervals: [],
      openStart: null,
      latestResolvedAt: null,
    };

    // Currently waiting on the reporter — this isn't "in progress" time at
    // all, so it gets its own bucket rather than counting against the
    // officer as if they were just sitting on it.
    if (ticket.statusName === WAITING_STATUS_NAME) {
      const waitingSince = info.openStart ?? ticket.createdAt;
      buckets.set(ticket.id, { kind: "waiting_on_reporter", days: daysBetween(waitingSince, now) });
      continue;
    }

    // Current status decides the bucket (not "ever had a Resolved log
    // entry") — otherwise a ticket that was Resolved and later changed
    // again would still count as resolved. The log is only used to find
    // *when* it entered the current resolved state, and how much of the
    // elapsed time was spent waiting on the reporter along the way.
    if (RESOLVED_STATUS_NAMES.has(ticket.statusName)) {
      const resolvedAt = info.latestResolvedAt ?? ticket.createdAt;
      const rawDays = daysBetween(ticket.createdAt, resolvedAt);
      const waitingDays = overlapDays(info.closedIntervals, ticket.createdAt, resolvedAt);
      buckets.set(ticket.id, { kind: "resolved", days: Math.max(0, rawDays - waitingDays) });
      continue;
    }

    if (ticket.assigneeId) {
      const assignedAt = latestAssignedAt.get(ticket.id) ?? ticket.createdAt;
      const rawDays = daysBetween(assignedAt, now);
      const waitingDays = overlapDays(info.closedIntervals, assignedAt, now);
      buckets.set(ticket.id, { kind: "in_progress", days: Math.max(0, rawDays - waitingDays) });
      continue;
    }

    buckets.set(ticket.id, { kind: "unassigned", days: daysBetween(ticket.createdAt, now) });
  }

  return buckets;
}

// Time-to-first-response: the earlier of (a) the ticket's first assignment
// and (b) its first officer comment — either is a sign the ticket stopped
// waiting in a queue. `null` means neither has happened yet.
export async function getFirstResponseDays(
  tickets: { id: string; createdAt: Date }[],
): Promise<Map<string, number | null>> {
  const ticketIds = tickets.map((t) => t.id);

  const [assignmentLogs, officerComments] = await Promise.all([
    prisma.activityLog.findMany({
      where: { ticketId: { in: ticketIds }, field: "assignee", newValue: { not: null } },
      select: { ticketId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.comment.findMany({
      where: { ticketId: { in: ticketIds }, author: { role: "IT_OFFICER" } },
      select: { ticketId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Ascending order, so the first occurrence per ticket is the earliest.
  const firstAssignedAt = new Map<string, Date>();
  for (const log of assignmentLogs) {
    if (!firstAssignedAt.has(log.ticketId)) firstAssignedAt.set(log.ticketId, log.createdAt);
  }
  const firstOfficerCommentAt = new Map<string, Date>();
  for (const comment of officerComments) {
    if (!firstOfficerCommentAt.has(comment.ticketId)) {
      firstOfficerCommentAt.set(comment.ticketId, comment.createdAt);
    }
  }

  const result = new Map<string, number | null>();
  for (const ticket of tickets) {
    const candidates = [firstAssignedAt.get(ticket.id), firstOfficerCommentAt.get(ticket.id)].filter(
      (d): d is Date => d !== undefined,
    );
    if (candidates.length === 0) {
      result.set(ticket.id, null);
      continue;
    }
    const firstResponseAt = new Date(Math.min(...candidates.map((d) => d.getTime())));
    result.set(ticket.id, daysBetween(ticket.createdAt, firstResponseAt));
  }

  return result;
}
