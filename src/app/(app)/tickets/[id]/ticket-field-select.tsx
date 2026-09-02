"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTicketFieldAction } from "./actions";
import { useTicketEditMode } from "./ticket-details-edit-shell";

const NONE = "__none__";

type Item = { value: string; label: string };

// IT-Officer-only inline editor: while the detail page is in edit mode, each
// select auto-submits its own server action so every edit maps 1:1 to one
// activity-log entry.
export function TicketFieldSelect({
  ticketId,
  field,
  value,
  items,
  noneLabel,
}: {
  ticketId: string;
  field: "statusId" | "assigneeId" | "priority" | "category";
  value: string | null;
  items: Item[];
  /** When set, offers a "none" choice (e.g. Unassigned / No category). */
  noneLabel?: string;
}) {
  const { isEditing } = useTicketEditMode();
  const [current, setCurrent] = useState(value ?? (noneLabel ? NONE : value));
  const [isPending, startTransition] = useTransition();

  const allItems = noneLabel
    ? [{ value: NONE, label: noneLabel }, ...items]
    : items;
  const currentLabel =
    allItems.find((item) => item.value === current)?.label ?? "Not set";

  if (!isEditing) {
    return <span>{currentLabel}</span>;
  }

  return (
    <Select
      items={allItems}
      value={current}
      disabled={isPending}
      onValueChange={(next) => {
        if (next === null || next === current) return;
        const previous = current;
        setCurrent(next as string);
        startTransition(async () => {
          const result = await updateTicketFieldAction({
            ticketId,
            field,
            value: next === NONE ? null : next,
          });
          if (result.ok) {
            toast.success("Ticket updated");
          } else {
            setCurrent(previous);
            toast.error(result.error);
          }
        });
      }}
    >
      <SelectTrigger className="w-full" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
