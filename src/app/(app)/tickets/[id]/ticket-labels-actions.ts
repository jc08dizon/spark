"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logTicketFieldChange } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { getTicketById } from "@/lib/tickets-queries";

export type TicketLabelActionResult = { ok: true } | { ok: false; error: string };

// Attaching/detaching labels is officer-only, same gate as every other
// structural edit (priority/category/assignee/dueDate/links).
export async function addTicketLabelAction(
  ticketId: string,
  labelId: string,
): Promise<TicketLabelActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };
  if (session.user.role !== "IT_OFFICER") {
    return { ok: false, error: "Only IT Officers can label tickets." };
  }

  const ticket = await getTicketById(session, ticketId);
  if (!ticket) return { ok: false, error: "Ticket not found." };

  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label) return { ok: false, error: "Label not found." };

  await prisma.$transaction(async (tx) => {
    await tx.ticketLabel.upsert({
      where: { ticketId_labelId: { ticketId, labelId } },
      create: { ticketId, labelId },
      update: {},
    });
    await logTicketFieldChange(tx, {
      ticketId,
      userId: session.user.id,
      field: "label",
      oldValue: null,
      newValue: label.name,
    });
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { ok: true };
}

export async function removeTicketLabelAction(
  ticketId: string,
  labelId: string,
): Promise<TicketLabelActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };
  if (session.user.role !== "IT_OFFICER") {
    return { ok: false, error: "Only IT Officers can label tickets." };
  }

  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label) return { ok: false, error: "Label not found." };

  await prisma.$transaction(async (tx) => {
    await tx.ticketLabel.deleteMany({ where: { ticketId, labelId } });
    await logTicketFieldChange(tx, {
      ticketId,
      userId: session.user.id,
      field: "label",
      oldValue: label.name,
      newValue: null,
    });
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { ok: true };
}
