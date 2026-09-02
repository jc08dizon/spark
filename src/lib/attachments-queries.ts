import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

// Same role-scoping convention as tickets-queries.ts: every attachment read
// re-derives access from the parent ticket rather than trusting that the
// caller already checked. Employees only ever reach files on their own
// tickets, regardless of which attachment id they ask for.
export async function getAttachmentForAccess(session: Session, id: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: {
      ticket: {
        select: {
          id: true,
          reporterId: true,
          status: { select: { isClosed: true } },
        },
      },
    },
  });
  if (!attachment) return null;

  if (
    session.user.role === "EMPLOYEE" &&
    attachment.ticket.reporterId !== session.user.id
  ) {
    return null;
  }

  return attachment;
}
