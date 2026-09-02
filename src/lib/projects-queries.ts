import { prisma } from "@/lib/prisma";

// IT-Officer-only admin (Projects management). Callers gate on role;
// project.key and nextTicketNumber are never exposed as editable here —
// key is set once at creation, nextTicketNumber is only ever touched by
// createTicketWithKey's locked transaction.
export async function listProjects() {
  return prisma.project.findMany({
    select: {
      id: true,
      key: true,
      name: true,
      isActive: true,
      lead: { select: { name: true } },
      _count: { select: { tickets: true } },
    },
    orderBy: { key: "asc" },
  });
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      isActive: true,
      leadId: true,
    },
  });
}

export async function getOfficersForLeadPicker() {
  return prisma.user.findMany({
    where: { role: "IT_OFFICER" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
