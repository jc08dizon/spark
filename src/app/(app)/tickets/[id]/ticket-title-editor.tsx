"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Pencil, X } from "lucide-react";
import { updateTicketFieldAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TicketTitleEditor({
  ticketId,
  title,
  canEdit,
}: {
  ticketId: string;
  title: string;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    return <h1 className="text-2xl font-semibold text-foreground">{title}</h1>;
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-1.5">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setValue(title);
            setIsEditing(true);
          }}
          aria-label="Edit title"
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
    );
  }

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Title is required");
      return;
    }
    startTransition(async () => {
      const result = await updateTicketFieldAction({
        ticketId,
        field: "title",
        value: trimmed,
      });
      if (result.ok) {
        toast.success("Title updated");
        setIsEditing(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={200}
        disabled={isPending}
        autoFocus
        className="max-w-md text-base font-semibold"
      />
      <Button
        type="button"
        size="icon-sm"
        disabled={isPending}
        onClick={handleSave}
        aria-label="Save title"
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        onClick={() => setIsEditing(false)}
        aria-label="Cancel"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
