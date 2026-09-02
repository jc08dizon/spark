"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logTicketFieldChange } from "@/lib/activity-log";
import {
  deleteAttachmentFile,
  saveAttachmentFile,
  validateAttachmentFiles,
} from "@/lib/attachments";
import { getAttachmentForAccess } from "@/lib/attachments-queries";
import { categoryLabels, priorityLabels } from "@/lib/labels";
import { findMentionedUsers } from "@/lib/mentions";
import { notifyTicketEvent } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatTicketKey } from "@/lib/tickets";
import { getTicketById, getTicketStatusBySlug } from "@/lib/tickets-queries";
import { getMentionableUsers } from "@/lib/users-queries";
import {
  addCommentSchema,
  cancelTicketSchema,
  updateTicketFieldSchema,
} from "@/lib/validation/ticket";

export type UpdateFieldResult = { ok: true } | { ok: false; error: string };

// Log entries stay short and skimmable — description can run to 5000 chars,
// so only a preview is kept in the activity trail, not the full text.
function truncateForLog(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatLogDate(date: Date): string {
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

// Editing status/assignee/priority/category is IT-Officer-only (business
// rule 2) — enforced below, not just hidden in the UI. Title/description
// use a different rule: the reporter or any officer, but only while the
// ticket is open (mirrors the cancel-ticket gate on status.isClosed).
export async function updateTicketFieldAction(
  input: unknown,
): Promise<UpdateFieldResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };

  const parsed = updateTicketFieldSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid update." };
  }
  const { ticketId, field, value } = parsed.data;

  const ticket = await getTicketById(session, ticketId);
  if (!ticket) return { ok: false, error: "Ticket not found." };

  const isOfficer = session.user.role === "IT_OFFICER";
  const isContentField = field === "title" || field === "description";

  if (isContentField) {
    const isReporter = ticket.reporterId === session.user.id;
    if (!isOfficer && !isReporter) {
      return { ok: false, error: "You cannot edit this ticket." };
    }
    if (ticket.status.isClosed) {
      return { ok: false, error: "Closed tickets cannot be edited." };
    }
  } else if (!isOfficer) {
    return { ok: false, error: "Only IT Officers can edit tickets." };
  }

  const actorId = session.user.id;
  const ticketKey = formatTicketKey(ticket.project.key, ticket.ticketNumber);

  if (field === "statusId") {
    if (value === ticket.statusId) return { ok: true };
    const newStatus = await prisma.ticketStatus.findUnique({
      where: { id: value },
    });
    if (!newStatus) return { ok: false, error: "Unknown status." };

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({ where: { id: ticketId }, data: { statusId: value } });
      await logTicketFieldChange(tx, {
        ticketId,
        userId: actorId,
        field: "status",
        oldValue: ticket.status.name,
        newValue: newStatus.name,
      });
      await notifyTicketEvent(tx, {
        ticket,
        actorId,
        type: "STATUS_CHANGED",
        message: `Ticket ${ticketKey} status changed to ${newStatus.name}`,
      });
    });
  } else if (field === "assigneeId") {
    if (value === ticket.assigneeId) return { ok: true };
    let newAssigneeName: string | null = null;
    if (value !== null) {
      const assignee = await prisma.user.findUnique({ where: { id: value } });
      if (!assignee || assignee.role !== "IT_OFFICER") {
        return { ok: false, error: "Tickets can only be assigned to IT Officers." };
      }
      newAssigneeName = assignee.name;
    }

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({ where: { id: ticketId }, data: { assigneeId: value } });
      await logTicketFieldChange(tx, {
        ticketId,
        userId: actorId,
        field: "assignee",
        oldValue: ticket.assignee?.name ?? null,
        newValue: newAssigneeName,
      });
      if (value !== null) {
        // A newly-assigned officer auto-watches the ticket.
        await tx.ticketWatcher.upsert({
          where: { ticketId_userId: { ticketId, userId: value } },
          create: { ticketId, userId: value },
          update: {},
        });
        // Notify the reporter and the new assignee; recipients are
        // re-derived from the post-update assignee, not the stale `ticket`.
        await notifyTicketEvent(tx, {
          ticket: { ...ticket, assigneeId: value },
          actorId,
          type: "ASSIGNED",
          message: `Ticket ${ticketKey} was assigned to ${newAssigneeName}`,
        });
      }
    });
  } else if (field === "priority") {
    if (value === ticket.priority) return { ok: true };
    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({ where: { id: ticketId }, data: { priority: value } });
      await logTicketFieldChange(tx, {
        ticketId,
        userId: actorId,
        field: "priority",
        oldValue: priorityLabels[ticket.priority],
        newValue: priorityLabels[value],
      });
    });
  } else if (field === "category") {
    if (value === ticket.category) return { ok: true };
    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({ where: { id: ticketId }, data: { category: value } });
      await logTicketFieldChange(tx, {
        ticketId,
        userId: actorId,
        field: "category",
        oldValue: ticket.category ? categoryLabels[ticket.category] : null,
        newValue: value ? categoryLabels[value] : null,
      });
    });
  } else if (field === "title") {
    if (value === ticket.title) return { ok: true };
    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({ where: { id: ticketId }, data: { title: value } });
      await logTicketFieldChange(tx, {
        ticketId,
        userId: actorId,
        field: "title",
        oldValue: ticket.title,
        newValue: value,
      });
    });
  } else if (field === "description") {
    if (value === ticket.description) return { ok: true };
    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({ where: { id: ticketId }, data: { description: value } });
      await logTicketFieldChange(tx, {
        ticketId,
        userId: actorId,
        field: "description",
        oldValue: truncateForLog(ticket.description),
        newValue: truncateForLog(value),
      });
    });
  } else {
    const newDueDate = value ? new Date(value) : null;
    if (newDueDate && Number.isNaN(newDueDate.getTime())) {
      return { ok: false, error: "Invalid due date." };
    }
    if ((newDueDate?.getTime() ?? null) === (ticket.dueDate?.getTime() ?? null)) {
      return { ok: true };
    }
    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({ where: { id: ticketId }, data: { dueDate: newDueDate } });
      await logTicketFieldChange(tx, {
        ticketId,
        userId: actorId,
        field: "due date",
        oldValue: ticket.dueDate ? formatLogDate(ticket.dueDate) : null,
        newValue: newDueDate ? formatLogDate(newDueDate) : null,
      });
    });
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { ok: true };
}

export type AddCommentState =
  | { error?: string; success?: boolean }
  | undefined;

export async function addCommentAction(
  _prevState: AddCommentState,
  formData: FormData,
): Promise<AddCommentState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const parsed = addCommentSchema.safeParse({
    ticketId: formData.get("ticketId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  // Same scoping gate as the page read: an Employee can only comment on a
  // ticket they can see (their own); anyone else's returns null here.
  const ticket = await getTicketById(session, parsed.data.ticketId);
  if (!ticket) return { error: "Ticket not found." };

  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const attachmentError = validateAttachmentFiles(files);
  if (attachmentError) return { error: attachmentError };

  // Written to disk before the transaction so a failed write never leaves
  // an orphaned Attachment row.
  const saved = await Promise.all(
    files.map(async (file) => ({
      file,
      storagePath: await saveAttachmentFile(file),
    })),
  );

  // Candidates are always people who can already see this ticket (every
  // officer, plus the reporter) — a mention can never grant visibility it
  // didn't already have.
  const mentionCandidates = await getMentionableUsers(ticket);
  const mentioned = findMentionedUsers(parsed.data.body, mentionCandidates).filter(
    (u) => u.id !== session.user.id,
  );
  const ticketKey = formatTicketKey(ticket.project.key, ticket.ticketNumber);
  const authorName = session.user.name ?? "Someone";

  // A reporter reply is exactly the event "Waiting on Reporter" is waiting
  // for — flip it back to In Progress automatically so tickets don't rot in
  // that status waiting for an officer to notice and flip it manually.
  const reporterResponded =
    ticket.status.slug === "waiting-on-reporter" &&
    session.user.id === ticket.reporterId;
  const inProgressStatus = reporterResponded
    ? await getTicketStatusBySlug("in-progress")
    : null;

  await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        ticketId: ticket.id,
        authorId: session.user.id,
        body: parsed.data.body,
      },
    });

    if (inProgressStatus) {
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { statusId: inProgressStatus.id },
      });
      await logTicketFieldChange(tx, {
        ticketId: ticket.id,
        userId: session.user.id,
        field: "status",
        oldValue: ticket.status.name,
        newValue: inProgressStatus.name,
      });
      await notifyTicketEvent(tx, {
        ticket,
        actorId: session.user.id,
        type: "STATUS_CHANGED",
        message: `${ticketKey} status changed to In Progress (reporter responded)`,
      });
    }

    for (const { file, storagePath } of saved) {
      await tx.attachment.create({
        data: {
          ticketId: ticket.id,
          commentId: comment.id,
          uploaderId: session.user.id,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          storagePath,
        },
      });
      await logTicketFieldChange(tx, {
        ticketId: ticket.id,
        userId: session.user.id,
        field: "attachment",
        oldValue: null,
        newValue: file.name,
      });
    }

    await notifyTicketEvent(tx, {
      ticket,
      actorId: session.user.id,
      type: "COMMENTED",
      message: `${authorName} commented on ${ticketKey}`,
    });

    for (const user of mentioned) {
      await tx.ticketWatcher.upsert({
        where: { ticketId_userId: { ticketId: ticket.id, userId: user.id } },
        create: { ticketId: ticket.id, userId: user.id },
        update: {},
      });
      await tx.notification.create({
        data: {
          userId: user.id,
          ticketId: ticket.id,
          type: "MENTIONED",
          message: `${authorName} mentioned you in ${ticketKey}`,
        },
      });
    }
  });

  revalidatePath(`/tickets/${ticket.id}`);
  return { success: true };
}

export type DeleteAttachmentResult = { ok: true } | { ok: false; error: string };

export async function deleteAttachmentAction(
  attachmentId: string,
): Promise<DeleteAttachmentResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };

  const attachment = await getAttachmentForAccess(session, attachmentId);
  if (!attachment) return { ok: false, error: "Attachment not found." };

  const isOfficer = session.user.role === "IT_OFFICER";
  const isOwnUpload = attachment.uploaderId === session.user.id;
  if (!isOfficer && !isOwnUpload) {
    return { ok: false, error: "You can only remove your own attachments." };
  }
  if (!isOfficer && attachment.ticket.status.isClosed) {
    return { ok: false, error: "This ticket is closed." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.attachment.delete({ where: { id: attachmentId } });
    await logTicketFieldChange(tx, {
      ticketId: attachment.ticketId,
      userId: session.user.id,
      field: "attachment",
      oldValue: attachment.filename,
      newValue: null,
    });
  });
  await deleteAttachmentFile(attachment.storagePath);

  revalidatePath(`/tickets/${attachment.ticketId}`);
  return { ok: true };
}
export type CancelTicketState =
  | { error?: string; success?: boolean }
  | undefined;

export async function cancelTicketAction(
  _prevState: CancelTicketState,
  formData: FormData,
): Promise<CancelTicketState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const parsed = cancelTicketSchema.safeParse({
    ticketId: formData.get("ticketId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid cancellation reason.",
    };
  }

  const ticket = await getTicketById(session, parsed.data.ticketId);
  if (!ticket) return { error: "Ticket not found." };

  const canCancel =
    session.user.role === "IT_OFFICER" || ticket.reporterId === session.user.id;
  if (!canCancel) {
    return { error: "You cannot cancel this ticket." };
  }

  if (ticket.status.isClosed) {
    return { error: "Closed tickets cannot be cancelled." };
  }

  const cancelledStatus = await prisma.ticketStatus.findUnique({
    where: { slug: "cancelled" },
  });
  if (!cancelledStatus) {
    return { error: "Cancelled status is missing. Run the database seed." };
  }

  const ticketKey = formatTicketKey(ticket.project.key, ticket.ticketNumber);

  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        statusId: cancelledStatus.id,
        cancellationReason: parsed.data.reason,
      },
    });
    await logTicketFieldChange(tx, {
      ticketId: ticket.id,
      userId: session.user.id,
      field: "status",
      oldValue: ticket.status.name,
      newValue: cancelledStatus.name,
    });
    await logTicketFieldChange(tx, {
      ticketId: ticket.id,
      userId: session.user.id,
      field: "cancellation reason",
      oldValue: null,
      newValue: parsed.data.reason,
    });
    await notifyTicketEvent(tx, {
      ticket,
      actorId: session.user.id,
      type: "CANCELLED",
      message: `Ticket ${ticketKey} was cancelled`,
    });
  });

  revalidatePath(`/tickets/${ticket.id}`);
  revalidatePath("/tickets");
  return { success: true };
}

export type MarkResolvedState = { error?: string; success?: boolean } | undefined;

// Reporter-only self-service shortcut — officers already have the full
// status dropdown, so this exists purely so a reporter can close their own
// loop ("fixed it myself" / "never mind") without waiting on an officer.
export async function markTicketResolvedAction(
  _prevState: MarkResolvedState,
  formData: FormData,
): Promise<MarkResolvedState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const ticketId = formData.get("ticketId");
  if (typeof ticketId !== "string" || !ticketId) {
    return { error: "Invalid ticket." };
  }

  const ticket = await getTicketById(session, ticketId);
  if (!ticket) return { error: "Ticket not found." };

  if (ticket.reporterId !== session.user.id) {
    return { error: "Only the reporter can mark this ticket resolved." };
  }
  if (ticket.status.isClosed) {
    return { error: "Closed tickets cannot be changed." };
  }
  if (ticket.status.slug === "resolved") {
    return { error: "Ticket is already resolved." };
  }

  const resolvedStatus = await getTicketStatusBySlug("resolved");
  if (!resolvedStatus) {
    return { error: "Resolved status is missing. Run the database seed." };
  }

  const ticketKey = formatTicketKey(ticket.project.key, ticket.ticketNumber);

  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticket.id },
      data: { statusId: resolvedStatus.id },
    });
    await logTicketFieldChange(tx, {
      ticketId: ticket.id,
      userId: session.user.id,
      field: "status",
      oldValue: ticket.status.name,
      newValue: resolvedStatus.name,
    });
    await notifyTicketEvent(tx, {
      ticket,
      actorId: session.user.id,
      type: "STATUS_CHANGED",
      message: `Ticket ${ticketKey} marked Resolved by the reporter`,
    });
  });

  revalidatePath(`/tickets/${ticket.id}`);
  revalidatePath("/tickets");
  return { success: true };
}

export type ToggleWatchResult =
  | { ok: true; watching: boolean }
  | { ok: false; error: string };

// Anyone who can see the ticket can watch it — this is independent of the
// officer-only field-edit gate above.
export async function toggleWatchAction(ticketId: string): Promise<ToggleWatchResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };

  const ticket = await getTicketById(session, ticketId);
  if (!ticket) return { ok: false, error: "Ticket not found." };

  const existing = await prisma.ticketWatcher.findUnique({
    where: { ticketId_userId: { ticketId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.ticketWatcher.delete({ where: { id: existing.id } });
  } else {
    await prisma.ticketWatcher.create({
      data: { ticketId, userId: session.user.id },
    });
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true, watching: !existing };
}
