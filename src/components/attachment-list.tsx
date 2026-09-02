"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Trash2,
} from "lucide-react";
import { deleteAttachmentAction } from "@/app/(app)/tickets/[id]/actions";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

export type AttachmentItem = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  uploader: { id: string; name: string };
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/zip") return FileArchive;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return FileSpreadsheet;
  }
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) {
    return FileText;
  }
  return File;
}

// Served through /api/attachments/[id], which re-checks ticket access on
// every request — safe to link directly, never a public/static path.
function attachmentUrl(id: string) {
  return `/api/attachments/${id}`;
}

export function AttachmentList({
  attachments,
  currentUserId,
  isOfficer,
  ticketClosed,
}: {
  attachments: AttachmentItem[];
  currentUserId: string;
  isOfficer: boolean;
  ticketClosed: boolean;
}) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const visible = attachments.filter((a) => !removedIds.has(a.id));
  if (visible.length === 0) return null;

  function handleDelete(id: string, filename: string) {
    startTransition(async () => {
      const result = await deleteAttachmentAction(id);
      if (result.ok) {
        setRemovedIds((prev) => new Set(prev).add(id));
        toast.success(`Removed ${filename}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <ul className="flex flex-col gap-2">
      {visible.map((attachment) => {
        const Icon = iconFor(attachment.mimeType);
        const isImage = attachment.mimeType.startsWith("image/");
        const isOwnUpload = attachment.uploader.id === currentUserId;
        const canDelete = isOfficer || (isOwnUpload && !ticketClosed);
        const url = attachmentUrl(attachment.id);

        return (
          <li
            key={attachment.id}
            className="flex items-center gap-3 rounded-md border border-border p-2"
          >
            {isImage ? (
              <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- auth-gated route, not a static asset next/image can optimize */}
                <img
                  src={url}
                  alt={attachment.filename}
                  className="size-10 rounded object-cover"
                />
              </a>
            ) : (
              <Icon className="size-8 shrink-0 text-muted-foreground" />
            )}

            <div className="flex min-w-0 flex-1 flex-col">
              <a
                href={url}
                download={attachment.filename}
                className="truncate text-sm font-medium text-primary hover:underline"
              >
                {attachment.filename}
              </a>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)} · {attachment.uploader.name}{" "}
                · {formatRelativeTime(attachment.createdAt)}
              </span>
            </div>

            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                onClick={() => handleDelete(attachment.id, attachment.filename)}
                aria-label={`Remove ${attachment.filename}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
