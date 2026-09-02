import { prisma } from "@/lib/prisma";

// Callers must already hold an access-checked ticket (e.g. from
// getTicketById) before calling this — it doesn't re-derive ticket
// visibility itself, just the current user's watch state on it.
export async function isTicketWatcher(userId: string, ticketId: string) {
  const row = await prisma.ticketWatcher.findUnique({
    where: { ticketId_userId: { ticketId, userId } },
  });
  return !!row;
}
