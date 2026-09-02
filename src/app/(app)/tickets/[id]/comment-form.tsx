"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addCommentAction } from "./actions";
import { AttachmentsField } from "@/app/(app)/tickets/attachments-field";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "./mention-textarea";

type MentionCandidate = { id: string; name: string };

export function CommentForm({
  ticketId,
  mentionCandidates,
}: {
  ticketId: string;
  mentionCandidates: MentionCandidate[];
}) {
  const [state, formAction, isPending] = useActionState(
    addCommentAction,
    undefined,
  );
  const [body, setBody] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Clearing `body` on success is done during render (comparing against the
  // previous action state) rather than in the effect below, since setState
  // synchronously inside an effect body is a cascading-render footgun.
  // Imperative DOM reset (for the uncontrolled attachment input) still
  // belongs in the effect — that's an external-system sync, not setState.
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state?.success) setBody("");
  }

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <MentionTextarea
        name="body"
        value={body}
        onChange={setBody}
        candidates={mentionCandidates}
        required
        rows={3}
        maxLength={2000}
        placeholder="Write a comment... use @ to mention someone"
      />
      <AttachmentsField name="attachments" />
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}
