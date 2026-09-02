import type { Prisma } from "@/generated/prisma/client";

// Always called with the transaction client of the mutation it describes,
// so a ticket change and its audit entry commit (or roll back) together.
// Values are stored as human-readable labels (status name, user name),
// not raw IDs — the Activity tab renders them directly without re-joining
// against possibly-deleted foreign keys.
export function logTicketFieldChange(
  tx: Prisma.TransactionClient,
  {
    ticketId,
    userId,
    field,
    oldValue,
    newValue,
  }: {
    ticketId: string;
    userId: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
  },
) {
  return tx.activityLog.create({
    data: { ticketId, userId, field, oldValue, newValue },
  });
}
