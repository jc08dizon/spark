import { Prisma, type Ticket } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { formatTicketKey } from "@/lib/tickets";

type CreateTicketInput = {
  title: string;
  description: string;
  projectId: string;
  reporterId: string;
  departmentId: string;
  statusId: string;
  priority: Ticket["priority"];
  type: Ticket["type"];
  category?: Ticket["category"] | null;
  assigneeId?: string | null;
};

// Ticket numbers are per-project sequential and must never collide under
// concurrent creation. We take a row lock on the project row (SELECT ...
// FOR UPDATE) inside a transaction before reading/incrementing the counter,
// and the (projectId, ticketNumber) unique constraint is a last-resort
// guard if that locking is ever bypassed. Don't replace this with a plain
// increment-and-hope — it will produce duplicate keys under load.
export async function createTicketWithKey(input: CreateTicketInput) {
  return prisma.$transaction(async (tx) => {
    const [project] = await tx.$queryRaw<{ id: string; key: string; nextTicketNumber: number }[]>(
      Prisma.sql`SELECT id, key, "nextTicketNumber" FROM "Project" WHERE id = ${input.projectId} FOR UPDATE`
    );

    if (!project) {
      throw new Error(`Project ${input.projectId} not found`);
    }

    const ticketNumber = project.nextTicketNumber;

    await tx.project.update({
      where: { id: input.projectId },
      data: { nextTicketNumber: ticketNumber + 1 },
    });

    const ticket = await tx.ticket.create({
      data: {
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        reporterId: input.reporterId,
        departmentId: input.departmentId,
        statusId: input.statusId,
        priority: input.priority,
        type: input.type,
        category: input.category ?? null,
        assigneeId: input.assigneeId ?? null,
        ticketNumber,
      },
      include: { project: true },
    });

    // Reporter auto-watches their own ticket from the start.
    await tx.ticketWatcher.create({
      data: { ticketId: ticket.id, userId: input.reporterId },
    });

    return { ticket, key: formatTicketKey(ticket.project.key, ticket.ticketNumber) };
  });
}
