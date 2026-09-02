import type { NotificationType, Prisma } from "@/generated/prisma/client";

type NotifyTicketEventInput = {
  ticket: { id: string; reporterId: string; assigneeId: string | null };
  type: NotificationType;
  actorId: string;
  message: string;
};

// Always called with the transaction client of the mutation that triggers
// it (status change, (re)assignment, cancellation, comment), so the
// notification commits atomically with the change it describes. Recipients
// are the reporter, assignee, and every ticket watcher, minus whoever
// performed the action — you don't need to be told about your own change.
export async function notifyTicketEvent(
  tx: Prisma.TransactionClient,
  { ticket, type, actorId, message }: NotifyTicketEventInput,
) {
  const watchers = await tx.ticketWatcher.findMany({
    where: { ticketId: ticket.id },
    select: { userId: true },
  });

  const recipientIds = new Set(
    [ticket.reporterId, ticket.assigneeId, ...watchers.map((w) => w.userId)].filter(
      (id): id is string => !!id && id !== actorId,
    ),
  );

  if (recipientIds.size === 0) return;

  await tx.notification.createMany({
    data: Array.from(recipientIds).map((userId) => ({
      userId,
      ticketId: ticket.id,
      type,
      message,
    })),
  });
}
