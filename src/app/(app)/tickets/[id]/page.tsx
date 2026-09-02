import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AttachmentList } from "@/components/attachment-list";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getUnusedLabelsForTicket } from "@/lib/labels-queries";
import { categoryLabels, priorityLabels, ticketTypeLabels } from "@/lib/labels";
import { getTicketLinks } from "@/lib/ticket-links";
import { formatDueDate, formatTicketKey, isTicketOverdue } from "@/lib/tickets";
import { getFirstResponseDays, getTicketTimingBuckets } from "@/lib/ticket-timing";
import { getAllTicketStatuses, getTicketById } from "@/lib/tickets-queries";
import { getAssignableUsers, getMentionableUsers } from "@/lib/users-queries";
import { formatRelativeTime } from "@/lib/utils";
import { isTicketWatcher } from "@/lib/watchers-queries";
import { CancelTicketForm } from "./cancel-ticket-form";
import { CommentsFeed } from "./comments-feed";
import { MarkResolvedForm } from "./mark-resolved-form";
import { TicketDescriptionEditor } from "./ticket-description-editor";
import { TicketDetailsEditShell } from "./ticket-details-edit-shell";
import { TicketDueDateField } from "./ticket-due-date-field";
import { TicketFieldSelect } from "./ticket-field-select";
import { TicketLabelsField } from "./ticket-labels-field";
import { TicketLinksPanel } from "./ticket-links-panel";
import { TicketTitleEditor } from "./ticket-title-editor";
import { WatchToggleButton } from "./watch-toggle-button";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const ticket = await getTicketById(session, id);
  if (!ticket) notFound();

  const isOfficer = session.user.role === "IT_OFFICER";
  const [statuses, assignees, unusedLabels] = isOfficer
    ? await Promise.all([
        getAllTicketStatuses(),
        getAssignableUsers(session),
        getUnusedLabelsForTicket(ticket.id),
      ])
    : [[], [], []];
  const [mentionCandidates, isWatching, timingBuckets, firstResponseDays, ticketLinks] =
    await Promise.all([
      getMentionableUsers(ticket),
      isTicketWatcher(session.user.id, ticket.id),
      getTicketTimingBuckets([
        {
          id: ticket.id,
          createdAt: ticket.createdAt,
          statusName: ticket.status.name,
          assigneeId: ticket.assigneeId,
        },
      ]),
      getFirstResponseDays([{ id: ticket.id, createdAt: ticket.createdAt }]),
      getTicketLinks(ticket.id),
    ]);
  const timingBucket = timingBuckets.get(ticket.id);
  const responseDays = firstResponseDays.get(ticket.id) ?? null;

  const ticketKey = formatTicketKey(ticket.project.key, ticket.ticketNumber);
  const isOverdue = isTicketOverdue(ticket.dueDate, ticket.status.isClosed);
  const canCancel =
    !ticket.status.isClosed &&
    (isOfficer || ticket.reporterId === session.user.id);
  // Same reporter-or-officer-while-open gate as cancellation; title and
  // description are the ticket's content, not its workflow state.
  const canEditContent =
    !ticket.status.isClosed &&
    (isOfficer || ticket.reporterId === session.user.id);
  const isReporter = ticket.reporterId === session.user.id;
  // Reporter-only self-service shortcut — officers already have the full
  // status dropdown, so this button only needs to exist for the reporter.
  const canMarkResolved =
    !isOfficer &&
    isReporter &&
    !ticket.status.isClosed &&
    ticket.status.slug !== "resolved";
  // Reopened was removed as a status; a resolved ticket that didn't
  // actually get fixed becomes a new, linked follow-up ticket instead.
  const canFileFollowUp =
    isReporter && (ticket.status.slug === "resolved" || ticket.status.isClosed);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="font-mono text-sm font-medium text-muted-foreground">
            {ticketKey}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <TicketTitleEditor
              ticketId={ticket.id}
              title={ticket.title}
              canEdit={canEditContent}
            />
            <StatusBadge name={ticket.status.name} color={ticket.status.color} />
            {isOverdue ? <Badge variant="destructive">Overdue</Badge> : null}
          </div>
          <TicketLabelsField
            ticketId={ticket.id}
            currentLabels={ticket.labels.map((tl) => tl.label)}
            availableLabels={unusedLabels}
            canEdit={isOfficer}
          />
        </div>
        <div className="flex items-center gap-2">
          <WatchToggleButton
            ticketId={ticket.id}
            initialWatching={isWatching}
            watcherCount={ticket._count.watchers}
          />
          {canMarkResolved ? <MarkResolvedForm ticketId={ticket.id} /> : null}
          {canFileFollowUp ? (
            <Link
              href={`/tickets/new?reopenFrom=${ticket.id}`}
              className={buttonVariants({ variant: "outline" })}
            >
              File a follow-up ticket
            </Link>
          ) : null}
          {canCancel ? <CancelTicketForm ticketId={ticket.id} /> : null}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="comments">
            Comments ({ticket.comments.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            Activity ({ticket.activityLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-2">
          <TicketDetailsEditShell canEdit={isOfficer}>
            <div className="flex flex-col gap-6">
              <TicketDescriptionEditor
                ticketId={ticket.id}
                description={ticket.description}
                canEdit={canEditContent}
              />

              <Separator />

              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <Field label="Status">
              {isOfficer ? (
                <TicketFieldSelect
                  ticketId={ticket.id}
                  field="statusId"
                  value={ticket.statusId}
                  items={statuses.map((s) => ({ value: s.id, label: s.name }))}
                />
              ) : (
                <StatusBadge
                  name={ticket.status.name}
                  color={ticket.status.color}
                />
              )}
            </Field>

            <Field label="Priority">
              {isOfficer ? (
                <TicketFieldSelect
                  ticketId={ticket.id}
                  field="priority"
                  value={ticket.priority}
                  items={Object.entries(priorityLabels).map(
                    ([value, label]) => ({ value, label }),
                  )}
                />
              ) : (
                priorityLabels[ticket.priority]
              )}
            </Field>

            <Field label="Assignee">
              {isOfficer ? (
                <TicketFieldSelect
                  ticketId={ticket.id}
                  field="assigneeId"
                  value={ticket.assigneeId}
                  items={assignees.map((u) => ({ value: u.id, label: u.name }))}
                  noneLabel="Unassigned"
                />
              ) : (
                (ticket.assignee?.name ?? "Unassigned")
              )}
            </Field>

            <Field label="Category">
              {isOfficer ? (
                <TicketFieldSelect
                  ticketId={ticket.id}
                  field="category"
                  value={ticket.category}
                  items={Object.entries(categoryLabels).map(
                    ([value, label]) => ({ value, label }),
                  )}
                  noneLabel="No category"
                />
              ) : ticket.category ? (
                categoryLabels[ticket.category]
              ) : (
                "—"
              )}
            </Field>

            <Field label="Type">{ticketTypeLabels[ticket.type]}</Field>
            <Field label="Reporter">{ticket.reporter.name}</Field>
            <Field label="Department">{ticket.department.name}</Field>
            <Field label="Created">
              {formatRelativeTime(ticket.createdAt)}
            </Field>

            <Field label="Due date">
              {isOfficer ? (
                <TicketDueDateField
                  ticketId={ticket.id}
                  dueDate={ticket.dueDate}
                  isOverdue={isOverdue}
                />
              ) : (
                <span className={isOverdue ? "font-medium text-destructive" : undefined}>
                  {formatDueDate(ticket.dueDate)}
                </span>
              )}
            </Field>

            <Field label="First response">
              {responseDays === null ? "Awaiting response" : `${responseDays}d`}
            </Field>

            {timingBucket?.kind === "resolved" ? (
              <Field label="Resolved in">{timingBucket.days}d</Field>
            ) : null}
              </dl>

              {ticket.attachments.length > 0 ? (
                <>
                  <Separator />
                  <div>
                    <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                      Attachments ({ticket.attachments.length})
                    </h2>
                    <AttachmentList
                      attachments={ticket.attachments}
                      currentUserId={session.user.id}
                      isOfficer={isOfficer}
                      ticketClosed={ticket.status.isClosed}
                    />
                  </div>
                </>
              ) : null}

              <Separator />
              <TicketLinksPanel ticketId={ticket.id} links={ticketLinks} canEdit={isOfficer} />

              {ticket.cancellationReason ? (
                <>
                  <Separator />
                  <div>
                    <h2 className="mb-2 text-sm font-medium text-destructive">
                      Cancellation reason
                    </h2>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {ticket.cancellationReason}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </TicketDetailsEditShell>
        </TabsContent>

        <TabsContent value="comments" className="pt-2">
          <CommentsFeed
            ticketId={ticket.id}
            comments={ticket.comments}
            currentUserId={session.user.id}
            isOfficer={isOfficer}
            ticketClosed={ticket.status.isClosed}
            mentionCandidates={mentionCandidates}
          />
        </TabsContent>

        <TabsContent value="activity" className="pt-2">
          {ticket.activityLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {ticket.activityLogs.map((log) => (
                <li key={log.id} className="text-sm text-foreground">
                  <span className="font-medium">{log.user.name}</span>{" "}
                  {log.oldValue ? (
                    <>
                      changed {log.field} from{" "}
                      <span className="font-medium">{log.oldValue}</span> to{" "}
                      <span className="font-medium">{log.newValue ?? "—"}</span>
                    </>
                  ) : (
                    <>
                      set {log.field} to{" "}
                      <span className="font-medium">{log.newValue ?? "—"}</span>
                    </>
                  )}{" "}
                  <span className="text-muted-foreground">
                    · {formatRelativeTime(log.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}
