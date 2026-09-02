"use client";

import { useActionState, useState } from "react";
import { CircleCheck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markTicketResolvedAction } from "./actions";

export function MarkResolvedForm({ ticketId }: { ticketId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(
    markTicketResolvedAction,
    undefined,
  );

  if (!isConfirming) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsConfirming(true)}
        className="w-fit"
      >
        <CircleCheck data-icon="inline-start" />
        Mark as Resolved
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-3 rounded-lg border p-4 sm:max-w-sm"
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <p className="text-sm text-muted-foreground">
        Are you sure this ticket is resolved?
      </p>

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-muted-foreground">Ticket marked as resolved.</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsConfirming(false)}
          disabled={isPending}
        >
          <Undo2 data-icon="inline-start" />
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          <CircleCheck data-icon="inline-start" />
          {isPending ? "Marking as resolved..." : "Confirm resolved"}
        </Button>
      </div>
    </form>
  );
}
