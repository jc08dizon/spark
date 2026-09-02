"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { updateTicketFieldAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function TicketDescriptionEditor({
  ticketId,
  description,
  canEdit,
}: {
  ticketId: string;
  description: string;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(description);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Description is required");
      return;
    }
    startTransition(async () => {
      const result = await updateTicketFieldAction({
        ticketId,
        field: "description",
        value: trimmed,
      });
      if (result.ok) {
        toast.success("Description updated");
        setIsEditing(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <h2 className="text-sm font-medium text-muted-foreground">Description</h2>
        {canEdit && !isEditing ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setValue(description);
              setIsEditing(true);
            }}
            aria-label="Edit description"
          >
            <Pencil className="size-3.5" />
          </Button>
        ) : null}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={5000}
            rows={6}
            disabled={isPending}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
              {isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-foreground">{description}</p>
      )}
    </div>
  );
}
