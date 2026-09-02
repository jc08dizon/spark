"use client";

import { useActionState, useState } from "react";
import { CircleX, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelTicketAction } from "./actions";

export function CancelTicketForm({ ticketId }: { ticketId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(
    cancelTicketAction,
    undefined,
  );

  if (!isConfirming) {
    return (
      <Button
        type="button"
        variant="destructive"
        onClick={() => setIsConfirming(true)}
        className="w-fit"
      >
        <CircleX data-icon="inline-start" />
        Cancel ticket
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 sm:max-w-sm"
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="cancellation-reason">Reason for cancellation</Label>
        <Textarea
          id="cancellation-reason"
          name="reason"
          required
          maxLength={2000}
          rows={4}
          placeholder="Briefly explain why this ticket is being cancelled."
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-muted-foreground">Ticket cancelled.</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsConfirming(false)}
          disabled={isPending}
        >
          <Undo2 data-icon="inline-start" />
          Keep ticket
        </Button>
        <Button type="submit" variant="destructive" disabled={isPending}>
          <CircleX data-icon="inline-start" />
          {isPending ? "Cancelling..." : "Confirm cancellation"}
        </Button>
      </div>
    </form>
  );
}
