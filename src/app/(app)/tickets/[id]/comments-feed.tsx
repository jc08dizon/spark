import { AttachmentList, type AttachmentItem } from "@/components/attachment-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { splitMentions, type MentionCandidate } from "@/lib/mentions";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { CommentForm } from "./comment-form";

type CommentItem = {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string };
  attachments: AttachmentItem[];
};

// Deliberately a social-feed layout (avatar + name + timestamp + body,
// oldest first) — the client explicitly rejected a table/grid treatment
// for comments in the original build. Don't turn this into a table.
export function CommentsFeed({
  ticketId,
  comments,
  currentUserId,
  isOfficer,
  ticketClosed,
  mentionCandidates,
}: {
  ticketId: string;
  comments: CommentItem[];
  currentUserId: string;
  isOfficer: boolean;
  ticketClosed: boolean;
  mentionCandidates: MentionCandidate[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No comments yet. Start the conversation below.
        </p>
      ) : (
        <ul className="flex flex-col">
          {comments.map((comment, index) => (
            <li key={comment.id}>
              {index > 0 && <Separator className="my-4" />}
              <div className="flex gap-3">
                <Avatar size="sm" className="mt-0.5">
                  <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {splitMentions(comment.body, mentionCandidates).map((segment, i) =>
                      segment.isMention ? (
                        <span
                          key={i}
                          className="rounded bg-primary/10 px-1 font-medium text-primary"
                        >
                          {segment.text}
                        </span>
                      ) : (
                        <span key={i}>{segment.text}</span>
                      ),
                    )}
                  </p>
                  {comment.attachments.length > 0 ? (
                    <div className="mt-1">
                      <AttachmentList
                        attachments={comment.attachments}
                        currentUserId={currentUserId}
                        isOfficer={isOfficer}
                        ticketClosed={ticketClosed}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Separator />
      <CommentForm ticketId={ticketId} mentionCandidates={mentionCandidates} />
    </div>
  );
}
