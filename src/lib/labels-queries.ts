import { prisma } from "@/lib/prisma";

// Officer-only admin (Labels management) — same convention as
// projects-queries.ts: callers gate on role, these queries carry no
// per-row sensitivity of their own.
export async function listLabels() {
  return prisma.label.findMany({
    select: {
      id: true,
      name: true,
      color: true,
      _count: { select: { tickets: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getLabelById(id: string) {
  return prisma.label.findUnique({
    where: { id },
    select: { id: true, name: true, color: true },
  });
}

// Labels not already attached to a ticket — feeds the "add label" picker on
// the ticket detail page so it only ever offers labels that make sense to add.
export async function getUnusedLabelsForTicket(ticketId: string) {
  return prisma.label.findMany({
    where: { tickets: { none: { ticketId } } },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });
}
