"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDueDate } from "@/lib/tickets";
import { updateTicketFieldAction } from "./actions";
import { useTicketEditMode } from "./ticket-details-edit-shell";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

// IT-Officer-only inline editor (Milestone 6), same auto-submit-per-change
// pattern as ticket-field-select.tsx but for a native date input instead of
// a Select — an empty value clears the due date.
export function TicketDueDateField({
  ticketId,
  dueDate,
  isOverdue,
}: {
  ticketId: string;
  dueDate: Date | null;
  isOverdue: boolean;
}) {
  const { isEditing } = useTicketEditMode();
  const [current, setCurrent] = useState(dueDate ? toDateInputValue(dueDate) : "");
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <span className={cn(isOverdue && "font-medium text-destructive")}>
        {formatDueDate(dueDate)}
      </span>
    );
  }

  return (
    <Input
      type="date"
      value={current}
      disabled={isPending}
      className="w-full"
      onChange={(e) => {
        const next = e.target.value;
        const previous = current;
        setCurrent(next);
        startTransition(async () => {
          const result = await updateTicketFieldAction({
            ticketId,
            field: "dueDate",
            value: next || null,
          });
          if (result.ok) {
            toast.success("Ticket updated");
          } else {
            setCurrent(previous);
            toast.error(result.error);
          }
        });
      }}
    />
  );
}
