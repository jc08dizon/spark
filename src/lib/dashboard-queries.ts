import type { Session } from "next-auth";
import { Priority } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getFirstResponseDays, getTicketTimingBuckets } from "@/lib/ticket-timing";

// ROLE-SCOPING CONVENTION (see tickets-queries.ts): the role branch is
// decided in here, never by the caller, so an officer-only aggregate (e.g.
// workload across all officers) can never be reached from an Employee
// session. The return type is a discriminated union on `role` so the page
// component is forced to narrow before rendering either branch.

const ticketListFields = {
  id: true,
  title: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { key: true } },
  status: true,
  assignee: { select: { id: true, name: true } },
} as const;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

// Milestone 6 (SLA-lite). Fetches every ticket's minimal timing shape (small
// dataset at this app's scale — same assumption already made elsewhere,
// e.g. plain ILIKE search) and reuses ticket-timing.ts rather than
// recomputing resolution/response math here.
async function getSlaMetrics() {
  const now = new Date();
  const [tickets, overdueCount] = await Promise.all([
    prisma.ticket.findMany({
      select: {
        id: true,
        createdAt: true,
        assigneeId: true,
        status: { select: { name: true } },
      },
    }),
    prisma.ticket.count({ where: { dueDate: { lt: now }, status: { isClosed: false } } }),
  ]);

  const timingInput = tickets.map((t) => ({
    id: t.id,
    createdAt: t.createdAt,
    statusName: t.status.name,
    assigneeId: t.assigneeId,
  }));

  const [buckets, firstResponse] = await Promise.all([
    getTicketTimingBuckets(timingInput),
    getFirstResponseDays(tickets),
  ]);

  const resolutionDays = [...buckets.values()]
    .filter((b) => b.kind === "resolved")
    .map((b) => b.days);
  const firstResponseDays = [...firstResponse.values()].filter((d): d is number => d !== null);

  return {
    overdueCount,
    avgResolutionDays: average(resolutionDays),
    avgFirstResponseDays: average(firstResponseDays),
  };
}

export async function getOfficerDashboard() {
  const [statuses, priorityGroups, officers, unassignedOpenCount, recentlyUpdated, oldestUnresolved, totalCount, sla] =
    await Promise.all([
      prisma.ticketStatus.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { tickets: true } } },
      }),
      prisma.ticket.groupBy({ by: ["priority"], _count: true }),
      prisma.user.findMany({
        where: { role: "IT_OFFICER" },
        select: {
          id: true,
          name: true,
          _count: {
            select: { assignedTickets: { where: { status: { isClosed: false } } } },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.ticket.count({ where: { assigneeId: null, status: { isClosed: false } } }),
      prisma.ticket.findMany({
        select: ticketListFields,
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.ticket.findMany({
        where: { status: { isClosed: false } },
        select: ticketListFields,
        orderBy: { createdAt: "asc" },
        take: 5,
      }),
      prisma.ticket.count(),
      getSlaMetrics(),
    ]);

  const openCount = statuses
    .filter((s) => !s.isClosed)
    .reduce((sum, s) => sum + s._count.tickets, 0);

  // groupBy omits priorities with zero tickets — reindex over every enum
  // value so the breakdown chart always shows all four bars.
  const countByPriority = new Map(priorityGroups.map((g) => [g.priority, g._count]));
  const priorityBreakdown = Object.values(Priority).map((priority) => ({
    priority,
    count: countByPriority.get(priority) ?? 0,
  }));

  const workload = officers.map((o) => ({
    id: o.id,
    name: o.name,
    openCount: o._count.assignedTickets,
  }));

  return {
    role: "IT_OFFICER" as const,
    openCount,
    unassignedOpenCount,
    totalCount,
    statusBreakdown: statuses.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      count: s._count.tickets,
    })),
    priorityBreakdown,
    workload,
    recentlyUpdated,
    oldestUnresolved,
    sla,
  };
}

async function getEmployeeDashboard(userId: string) {
  const [myOpenCount, myTotalCount, myOpenTickets, recentActivity] = await Promise.all([
    prisma.ticket.count({ where: { reporterId: userId, status: { isClosed: false } } }),
    prisma.ticket.count({ where: { reporterId: userId } }),
    prisma.ticket.findMany({
      where: { reporterId: userId, status: { isClosed: false } },
      select: ticketListFields,
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.activityLog.findMany({
      where: { ticket: { reporterId: userId } },
      include: {
        ticket: {
          select: { id: true, ticketNumber: true, title: true, project: { select: { key: true } } },
        },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    role: "EMPLOYEE" as const,
    myOpenCount,
    myTotalCount,
    myOpenTickets,
    recentActivity,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(session: Session) {
  if (session.user.role === "IT_OFFICER") {
    return getOfficerDashboard();
  }
  return getEmployeeDashboard(session.user.id);
}
