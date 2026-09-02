"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addTicketLabelAction, removeTicketLabelAction } from "./ticket-labels-actions";

type LabelOption = { id: string; name: string; color: string };

export function TicketLabelsField({
  ticketId,
  currentLabels,
  availableLabels,
  canEdit,
}: {
  ticketId: string;
  currentLabels: LabelOption[];
  availableLabels: LabelOption[];
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingLabelId, setPendingLabelId] = useState<string | null>(null);

  function handleAdd(labelId: string | null) {
    if (!labelId) return;
    setPendingLabelId(labelId);
    startTransition(async () => {
      const result = await addTicketLabelAction(ticketId, labelId);
      if (!result.ok) toast.error(result.error);
      setPendingLabelId(null);
    });
  }

  function handleRemove(labelId: string) {
    setPendingLabelId(labelId);
    startTransition(async () => {
      const result = await removeTicketLabelAction(ticketId, labelId);
      if (!result.ok) toast.error(result.error);
      setPendingLabelId(null);
    });
  }

  const availableItems = availableLabels.map((l) => ({ value: l.id, label: l.name }));

  if (currentLabels.length === 0 && !canEdit) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {currentLabels.map((label) => (
        <Badge key={label.id} variant="outline" className="gap-1.5">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: label.color }}
          />
          {label.name}
          {canEdit ? (
            <button
              type="button"
              aria-label={`Remove ${label.name}`}
              disabled={isPending && pendingLabelId === label.id}
              onClick={() => handleRemove(label.id)}
              className="ml-0.5 rounded-full hover:bg-muted"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </Badge>
      ))}

      {canEdit && availableLabels.length > 0 ? (
        <Select value="" onValueChange={handleAdd} items={availableItems} disabled={isPending}>
          <SelectTrigger size="sm" className="h-6 w-auto gap-1 border-dashed px-2 text-xs">
            <SelectValue placeholder="+ Add label" />
          </SelectTrigger>
          <SelectContent>
            {availableItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
