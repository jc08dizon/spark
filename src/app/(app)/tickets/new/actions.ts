"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  saveAttachmentFile,
  validateAttachmentFiles,
} from "@/lib/attachments";
import { logTicketFieldChange } from "@/lib/activity-log";
import { ticketLinkTypeLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatTicketKey } from "@/lib/tickets";
import { createTicketWithKey } from "@/lib/tickets-mutations";
import { getDefaultProject, getTicketStatusBySlug } from "@/lib/tickets-queries";
import { createTicketSchema, firstFieldErrors } from "@/lib/validation/ticket";

export type CreateTicketState =
  | {
      formError?: string;
      fieldErrors?: Record<string, string>;
    }
  | undefined;

export async function createTicketAction(
  _prevState: CreateTicketState,
  formData: FormData,
): Promise<CreateTicketState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isOfficer = session.user.role === "IT_OFFICER";

  const parsed = createTicketSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    // Category and reporter are IT-Officer-only. Discard anything an
    // Employee submits for them — hiding the fields in the UI isn't enough.
    category: isOfficer ? formData.get("category") || null : null,
    reporterId: isOfficer ? formData.get("reporterId") || null : null,
    reopenFromTicketId: formData.get("reopenFromTicketId") || null,
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error) };
  }

  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const attachmentError = validateAttachmentFiles(files);
  if (attachmentError) {
    return { formError: attachmentError };
  }

  const reporterId =
    isOfficer && parsed.data.reporterId ? parsed.data.reporterId : session.user.id;

  const reporter = await prisma.user.findUnique({
    where: { id: reporterId },
    select: { id: true, departmentId: true },
  });
  if (!reporter) {
    return { formError: "The selected reporter no longer exists." };
  }
  // Department always derives from the resolved reporter, never the form.
  if (!reporter.departmentId) {
    return {
      formError:
        "The reporter has no department assigned. Update their profile first.",
    };
  }

  const [project, openStatus] = await Promise.all([
    getDefaultProject(),
    getTicketStatusBySlug("open"),
  ]);
  if (!project || !openStatus) {
    return {
      formError: "Default project or Open status is missing. Run the database seed.",
    };
  }

  const { ticket, key: ticketKey } = await createTicketWithKey({
    title: parsed.data.title,
    description: parsed.data.description,
    type: parsed.data.type,
    category: parsed.data.category ?? null,
    priority: "MEDIUM",
    projectId: project.id,
    reporterId: reporter.id,
    departmentId: reporter.departmentId,
    statusId: openStatus.id,
    assigneeId: null,
  });

  // Reopened was removed as a status; a resolved ticket that didn't
  // actually get fixed becomes this: a fresh ticket, linked back to the
  // original via REOPENS. Only honored for the original's own reporter —
  // if the id is missing, stale, or belongs to someone else, this is
  // silently skipped rather than failing the whole ticket creation, since
  // it's a convenience prefill, not a required step.
  if (parsed.data.reopenFromTicketId) {
    const original = await prisma.ticket.findUnique({
      where: { id: parsed.data.reopenFromTicketId },
      select: { id: true, reporterId: true, project: { select: { key: true } }, ticketNumber: true },
    });
    if (original && original.reporterId === reporter.id) {
      const originalKey = formatTicketKey(original.project.key, original.ticketNumber);
      await prisma.$transaction(async (tx) => {
        await tx.ticketLink.create({
          data: { sourceId: ticket.id, targetId: original.id, linkType: "REOPENS" },
        });
        await logTicketFieldChange(tx, {
          ticketId: ticket.id,
          userId: session.user.id,
          field: "link",
          oldValue: null,
          newValue: `${ticketLinkTypeLabels.REOPENS} ${originalKey}`,
        });
        await logTicketFieldChange(tx, {
          ticketId: original.id,
          userId: session.user.id,
          field: "link",
          oldValue: null,
          newValue: `Reopened by ${ticketKey}`,
        });
      });
    }
  }

  if (files.length > 0) {
    // Written to disk before the DB transaction so a failed write never
    // leaves an orphaned Attachment row.
    const saved = await Promise.all(
      files.map(async (file) => ({
        file,
        storagePath: await saveAttachmentFile(file),
      })),
    );

    await prisma.$transaction(async (tx) => {
      for (const { file, storagePath } of saved) {
        await tx.attachment.create({
          data: {
            ticketId: ticket.id,
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
    });
  }

  redirect("/tickets");
}
