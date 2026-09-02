// Pure, client-safe helpers only — no `prisma` import here. A client
// component (ticket-due-date-field.tsx) imports from this module, and
// bundling `prisma`/`pg` into client code breaks the browser build (`pg`
// needs Node's `dns` module). Server-side ticket mutations live in
// tickets-mutations.ts instead.

export function formatTicketKey(projectKey: string, ticketNumber: number) {
  return `${projectKey}-${String(ticketNumber).padStart(3, "0")}`;
}

// Shared by any ticket-list page (All Tickets, My Tasks, ...) that parses
// filters out of URL search params.
export function isValidEnumValue<T extends string>(
  value: string | undefined,
  enumObject: Record<string, T>,
): value is T {
  return !!value && Object.values(enumObject).includes(value as T);
}

// "2026-07-07" parses as UTC midnight; the day-after trick gives an
// inclusive end-of-day bound without needing time-of-day math elsewhere.
export function endOfDayExclusive(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

export function parseStartDate(dateStr: string) {
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// Calendar-day difference (not a raw ms/24h divide) so "Due today" reads
// correctly regardless of what time of day it currently is.
function dueDateDiffDays(dueDate: Date) {
  const now = new Date();
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startOfDue = Date.UTC(
    dueDate.getUTCFullYear(),
    dueDate.getUTCMonth(),
    dueDate.getUTCDate(),
  );
  return Math.round((startOfDue - startOfToday) / 86_400_000);
}

export function isTicketOverdue(dueDate: Date | null, isClosed: boolean) {
  return !!dueDate && !isClosed && dueDateDiffDays(dueDate) < 0;
}

export function formatDueDate(dueDate: Date | null) {
  if (!dueDate) return "—";
  const diffDays = dueDateDiffDays(dueDate);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  return `Due in ${diffDays}d`;
}
