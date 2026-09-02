import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

// Officer-only: options for the reporter picker on ticket create. Employees
// always report as themselves, so they get nothing here.
export async function getReporterOptions(session: Session) {
  if (session.user.role !== "IT_OFFICER") return [];
  return prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

// Tickets are only ever assigned to IT Officers (locked-in decision from
// the build-out plan) — the assignee picker never offers Employees.
export async function getAssignableUsers(session: Session) {
  if (session.user.role !== "IT_OFFICER") return [];
  return prisma.user.findMany({
    where: { role: "IT_OFFICER" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

// Everyone who could ever legitimately see a given ticket: every IT Officer
// (they see all tickets) plus that ticket's own reporter. @mention
// autocomplete and mention resolution both draw from this list, which is
// what keeps a mention from ever granting visibility it didn't already
// have — an Employee can never mention another Employee, since nobody but
// the reporter (themselves) and officers are ever candidates.
export async function getMentionableUsers(ticket: { reporterId: string }) {
  const [officers, reporter] = await Promise.all([
    prisma.user.findMany({
      where: { role: "IT_OFFICER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: ticket.reporterId },
      select: { id: true, name: true },
    }),
  ]);

  const byId = new Map(officers.map((u) => [u.id, u]));
  if (reporter) byId.set(reporter.id, reporter);
  return Array.from(byId.values());
}

export async function getCurrentUserProfile(session: Session) {
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      departmentId: true,
      department: { select: { name: true } },
    },
  });
}

// Everything below is IT-Officer-only admin (Users management). Callers
// (pages/actions) are responsible for the role gate; these queries don't
// re-check it themselves since they carry no per-row sensitivity the way
// ticket data does — but they should only ever be reached from /users/*.
export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
    },
  });
}

export async function getAllDepartments() {
  return prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
