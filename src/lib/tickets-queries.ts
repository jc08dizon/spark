import type { Session } from "next-auth";
import type { Category, Prisma, Priority, TicketType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// ROLE-SCOPING CONVENTION (see PROJECT-NOTES.md rule: query-level scoping,
// not UI hiding): every read of ticket data goes through this module, never
// a raw prisma.ticket.* call from a page or server action. Each function
// takes the full server-side session (from `await auth()`) and enforces
// scoping unconditionally — Employees are hard-restricted to their own
// tickets and no caller-supplied filter can widen that.

export const TICKETS_PAGE_SIZE = 25;

export const TICKET_SORT_OPTIONS = {
  created_desc: { label: "Newest first", orderBy: { createdAt: "desc" as const } },
  created_asc: { label: "Oldest first", orderBy: { createdAt: "asc" as const } },
  updated_desc: { label: "Recently updated", orderBy: { updatedAt: "desc" as const } },
  priority_desc: { label: "Priority: high to low", orderBy: { priority: "desc" as const } },
  priority_asc: { label: "Priority: low to high", orderBy: { priority: "asc" as const } },
  status_asc: { label: "Status order", orderBy: { status: { sortOrder: "asc" as const } } },
} satisfies Record<string, { label: string; orderBy: Prisma.TicketOrderByWithRelationInput }>;

export type TicketSort = keyof typeof TICKET_SORT_OPTIONS;
export const DEFAULT_TICKET_SORT: TicketSort = "created_desc";

export type TicketListFilters = {
  statusSlug?: string;
  search?: string;
  priority?: Priority;
  type?: TicketType;
  category?: Category;
  /** A user id, or the sentinel "unassigned" for assigneeId: null. */
  assigneeId?: string;
  labelId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  /** Restricts to non-closed statuses when no explicit statusSlug is set — used by My Tasks so the default view is a work queue, not full history. */
  openOnly?: boolean;
  sort?: TicketSort;
  page?: number;
};

// Ticket-key search ("ITSD-7", "itsd-007") targets the exact ticket number;
// anything else falls back to a plain title/description text search so
// normal words with trailing digits (e.g. "Room 204") aren't misread as keys.
function buildSearchClause(search: string): Prisma.TicketWhereInput {
  const trimmed = search.trim();
  const keyMatch = trimmed.match(/^[A-Za-z]+-(\d+)$/);
  if (keyMatch) {
    return { ticketNumber: parseInt(keyMatch[1], 10) };
  }
  return {
    OR: [
      { title: { contains: trimmed, mode: "insensitive" } },
      { description: { contains: trimmed, mode: "insensitive" } },
    ],
  };
}

const listInclude = {
  project: { select: { key: true } },
  status: true,
  reporter: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true } },
  labels: {
    include: { label: { select: { id: true, name: true, color: true } } },
  },
} satisfies Prisma.TicketInclude;

export type TicketListItem = Prisma.TicketGetPayload<{
  include: typeof listInclude;
}>;

// Shared by getTicketsForUser and getTicketsForBoard so the two never drift
// on what a filter means or how role-scoping is enforced.
function buildTicketWhere(session: Session, filters?: TicketListFilters): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};

  if (filters?.statusSlug) {
    where.status = { slug: filters.statusSlug };
  } else if (filters?.openOnly) {
    where.status = { isClosed: false };
  }
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.type) where.type = filters.type;
  if (filters?.category) where.category = filters.category;
  if (filters?.assigneeId === "unassigned") {
    where.assigneeId = null;
  } else if (filters?.assigneeId) {
    where.assigneeId = filters.assigneeId;
  }
  if (filters?.labelId) {
    where.labels = { some: { labelId: filters.labelId } };
  }
  if (filters?.dateFrom || filters?.dateTo) {
    // dateTo is treated as an exclusive upper bound — callers pass the
    // start of the day *after* the selected end date so the range covers
    // that whole day.
    where.createdAt = {
      ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { lt: filters.dateTo } : {}),
    };
  }
  if (filters?.search) {
    Object.assign(where, buildSearchClause(filters.search));
  }

  // Applied last so no filter can override it.
  if (session.user.role === "EMPLOYEE") {
    where.reporterId = session.user.id;
  }

  return where;
}

export async function getTicketsForUser(
  session: Session,
  filters?: TicketListFilters,
): Promise<{ tickets: TicketListItem[]; total: number; page: number; totalPages: number }> {
  const where = buildTicketWhere(session, filters);
  const page = Math.max(1, filters?.page ?? 1);
  const orderBy = TICKET_SORT_OPTIONS[filters?.sort ?? DEFAULT_TICKET_SORT].orderBy;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: listInclude,
      orderBy,
      skip: (page - 1) * TICKETS_PAGE_SIZE,
      take: TICKETS_PAGE_SIZE,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    tickets,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / TICKETS_PAGE_SIZE)),
  };
}

// Milestone 8 (Kanban board): the board needs every officer-visible ticket
// at once, grouped by status client-side — not one paginated page. Same
// "small dataset" assumption already made for SLA metrics
// (dashboard-queries.ts fetches every ticket unpaginated too).
export async function getTicketsForBoard(
  session: Session,
  filters?: Pick<TicketListFilters, "assigneeId">,
): Promise<TicketListItem[]> {
  const where = buildTicketWhere(session, filters);
  return prisma.ticket.findMany({
    where,
    include: listInclude,
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
}

const detailInclude = {
  project: { select: { key: true } },
  status: true,
  reporter: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  department: { select: { id: true, name: true } },
  comments: {
    include: {
      author: { select: { id: true, name: true } },
      attachments: {
        include: { uploader: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" as const },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  attachments: {
    include: { uploader: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  activityLogs: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" as const },
  },
  labels: {
    include: { label: { select: { id: true, name: true, color: true } } },
    orderBy: { label: { name: "asc" as const } },
  },
  _count: { select: { watchers: true } },
} satisfies Prisma.TicketInclude;

export type TicketDetail = Prisma.TicketGetPayload<{
  include: typeof detailInclude;
}>;

// Returns null both when the ticket doesn't exist and when an Employee
// requests someone else's ticket — callers render notFound() for both, so
// ticket existence is never leaked to unauthorized users.
export async function getTicketById(
  session: Session,
  id: string,
): Promise<TicketDetail | null> {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: detailInclude,
  });

  if (!ticket) return null;

  if (session.user.role === "EMPLOYEE" && ticket.reporterId !== session.user.id) {
    return null;
  }

  return ticket;
}

export async function getAllTicketStatuses() {
  return prisma.ticketStatus.findMany({ orderBy: { sortOrder: "asc" } });
}

// Business rule: all tickets are filed against the default ITSD project;
// the project is never user-selectable on create.
export const DEFAULT_PROJECT_KEY = "ITSD";

export async function getDefaultProject() {
  return prisma.project.findUnique({ where: { key: DEFAULT_PROJECT_KEY } });
}

export async function getTicketStatusBySlug(slug: string) {
  return prisma.ticketStatus.findUnique({ where: { slug } });
}
