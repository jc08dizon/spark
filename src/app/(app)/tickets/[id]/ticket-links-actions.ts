"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logTicketFieldChange } from "@/lib/activity-log";
import { ticketLinkTypeLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { findTicketByKey } from "@/lib/ticket-links";
import { formatTicketKey } from "@/lib/tickets";
import { getTicketById } from "@/lib/tickets-queries";
import { addTicketLinkSchema } from "@/lib/validation/ticket-link";

export type TicketLinkActionResult = { ok: true } | { ok: false; error: string };

// Linking is officer-only, same gate as every other structural edit
// (priority/category/assignee/dueDate) — never just hidden in the UI.
export async function addTicketLinkAction(input: unknown): Promise<TicketLinkActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };
  if (session.user.role !== "IT_OFFICER") {
    return { ok: false, error: "Only IT Officers can link tickets." };
  }

  const parsed = addTicketLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { ticketId, key, linkType } = parsed.data;

  const ticket = await getTicketById(session, ticketId);
  if (!ticket) return { ok: false, error: "Ticket not found." };

  const target = await findTicketByKey(key);
  if (!target) return { ok: false, error: `No ticket found for "${key}".` };
  if (target.id === ticketId) {
    return { ok: false, error: "A ticket cannot be linked to itself." };
  }

  // DUPLICATES/RELATES_TO are symmetric in meaning, so check both
  // directions to avoid a redundant reverse entry. BLOCKS is directional —
  // "A blocks B" and "B blocks A" are different facts — so only the exact
  // direction is checked.
  const reverseCheck =
    linkType === "BLOCKS"
      ? { sourceId: ticketId, targetId: target.id, linkType }
      : {
          OR: [
            { sourceId: ticketId, targetId: target.id, linkType },
            { sourceId: target.id, targetId: ticketId, linkType },
          ],
        };
  const existing = await prisma.ticketLink.findFirst({ where: reverseCheck });
  if (existing) return { ok: false, error: "That link already exists." };

  const ticketKey = formatTicketKey(ticket.project.key, ticket.ticketNumber);
  const targetKey = formatTicketKey(target.project.key, target.ticketNumber);

  await prisma.$transaction(async (tx) => {
    await tx.ticketLink.create({
      data: { sourceId: ticketId, targetId: target.id, linkType },
    });
    await logTicketFieldChange(tx, {
      ticketId,
      userId: session.user.id,
      field: "link",
      oldValue: null,
      newValue: `${ticketLinkTypeLabels[linkType]} ${targetKey}`,
    });
    await logTicketFieldChange(tx, {
      ticketId: target.id,
      userId: session.user.id,
      field: "link",
      oldValue: null,
      newValue: `Linked from ${ticketKey} (${ticketLinkTypeLabels[linkType]})`,
    });
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath(`/tickets/${target.id}`);
  return { ok: true };
}

export async function removeTicketLinkAction(
  ticketId: string,
  linkId: string,
): Promise<TicketLinkActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };
  if (session.user.role !== "IT_OFFICER") {
    return { ok: false, error: "Only IT Officers can unlink tickets." };
  }

  const link = await prisma.ticketLink.findUnique({
    where: { id: linkId },
    include: {
      source: { select: { project: { select: { key: true } }, ticketNumber: true } },
      target: { select: { project: { select: { key: true } }, ticketNumber: true } },
    },
  });
  if (!link || (link.sourceId !== ticketId && link.targetId !== ticketId)) {
    return { ok: false, error: "Link not found." };
  }

  const otherKey =
    link.sourceId === ticketId
      ? formatTicketKey(link.target.project.key, link.target.ticketNumber)
      : formatTicketKey(link.source.project.key, link.source.ticketNumber);

  await prisma.$transaction(async (tx) => {
    await tx.ticketLink.delete({ where: { id: linkId } });
    await logTicketFieldChange(tx, {
      ticketId,
      userId: session.user.id,
      field: "link",
      oldValue: `${ticketLinkTypeLabels[link.linkType]} ${otherKey}`,
      newValue: null,
    });
  });

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}
