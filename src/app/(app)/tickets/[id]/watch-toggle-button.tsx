"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { toggleWatchAction } from "./actions";
import { Button } from "@/components/ui/button";

export function WatchToggleButton({
  ticketId,
  initialWatching,
  watcherCount,
}: {
  ticketId: string;
  initialWatching: boolean;
  watcherCount: number;
}) {
  const [watching, setWatching] = useState(initialWatching);
  const [count, setCount] = useState(watcherCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const wasWatching = watching;
    setWatching(!wasWatching);
    setCount((c) => c + (wasWatching ? -1 : 1));

    startTransition(async () => {
      const result = await toggleWatchAction(ticketId);
      if (!result.ok) {
        setWatching(wasWatching);
        setCount((c) => c + (wasWatching ? 1 : -1));
        toast.error(result.error);
        return;
      }
      toast.success(
        result.watching ? "You're watching this ticket" : "Stopped watching this ticket",
      );
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
      {watching ? (
        <Eye data-icon="inline-start" />
      ) : (
        <EyeOff data-icon="inline-start" />
      )}
      {watching ? "Watching" : "Watch"}
      <span className="text-muted-foreground">({count})</span>
    </Button>
  );
}
