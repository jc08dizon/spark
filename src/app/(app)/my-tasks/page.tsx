import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TicketsFilterBar } from "@/app/(app)/tickets/tickets-filter-bar";
import { StatusBadge } from "@/components/status-badge";
import { SavedFiltersBar } from "@/components/saved-filters-bar";
import {
  buildFilterQueryString,
  FilterLink,
  TicketListPagination,
} from "@/components/ticket-list-controls";
import { TicketLabelBadges } from "@/components/ticket-label-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Category, Priority, TicketType } from "@/generated/prisma/enums";
import { listLabels } from "@/lib/labels-queries";
import { priorityLabels, ticketTypeLabels } from "@/lib/labels";
import { listSavedFilters } from "@/lib/saved-filters";
import {
  endOfDayExclusive,
  formatDueDate,
  formatTicketKey,
  isTicketOverdue,
  isValidEnumValue,
  parseStartDate,
} from "@/lib/tickets";
import {
  DEFAULT_TICKET_SORT,
  getAllTicketStatuses,
  getTicketsForUser,
  TICKET_SORT_OPTIONS,
  type TicketSort,
} from "@/lib/tickets-queries";
import { cn, formatRelativeTime } from "@/lib/utils";

type SearchParams = {
  status?: string;
  q?: string;
  priority?: string;
  type?: string;
  category?: string;
  label?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
};

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");

  const params = await searchParams;

  const sort =
    params.sort && params.sort in TICKET_SORT_OPTIONS
      ? (params.sort as TicketSort)
      : DEFAULT_TICKET_SORT;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const filters = {
    // Forced server-side — never read from the URL, so this can't be
    // widened into someone else's queue by a crafted link.
    assigneeId: session.user.id,
    statusSlug: params.status,
    openOnly: true,
    search: params.q,
    priority: isValidEnumValue(params.priority, Priority) ? params.priority : undefined,
    type: isValidEnumValue(params.type, TicketType) ? params.type : undefined,
    category: isValidEnumValue(params.category, Category) ? params.category : undefined,
    labelId: params.label && params.label !== "any" ? params.label : undefined,
    dateFrom: params.from ? parseStartDate(params.from) : undefined,
    dateTo: params.to ? endOfDayExclusive(params.to) : undefined,
    sort,
    page,
  };

  const [{ tickets, total, totalPages }, statuses, labels, savedFilters] = await Promise.all([
    getTicketsForUser(session, filters),
    getAllTicketStatuses(),
    listLabels(),
    listSavedFilters(session.user.id, "/my-tasks"),
  ]);
  const currentQuery = buildFilterQueryString(params);

  const isSet = (value: string | undefined) => !!value && value !== "any";
  const hasActiveFilters =
    isSet(params.q) ||
    isSet(params.priority) ||
    isSet(params.type) ||
    isSet(params.category) ||
    isSet(params.label) ||
    isSet(params.from) ||
    isSet(params.to) ||
    (isSet(params.sort) && params.sort !== DEFAULT_TICKET_SORT);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">My Tasks</h1>

      <div className="flex flex-wrap items-center gap-2">
        <FilterLink href="/my-tasks" label="Active" active={!params.status} />
        {statuses.map((s) => (
          <FilterLink
            key={s.id}
            href={`/my-tasks?status=${s.slug}`}
            label={s.name}
            active={params.status === s.slug}
          />
        ))}
      </div>

      <SavedFiltersBar
        basePath="/my-tasks"
        savedFilters={savedFilters}
        currentQuery={currentQuery}
      />

      <TicketsFilterBar
        isOfficer
        hideAssignee
        basePath="/my-tasks"
        assignees={[]}
        labels={labels}
        currentStatus={params.status}
        values={{
          q: params.q,
          priority: params.priority,
          type: params.type,
          category: params.category,
          label: params.label,
          from: params.from,
          to: params.to,
          sort: params.sort,
        }}
        hasActiveFilters={hasActiveFilters}
      />

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {params.status || hasActiveFilters
              ? "No tickets match this filter."
              : "Nothing assigned to you right now."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Key</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const overdue = isTicketOverdue(ticket.dueDate, ticket.status.isClosed);
                  return (
                    <TableRow key={ticket.id} className={cn(overdue && "bg-destructive/5")}>
                      <TableCell className="font-mono text-xs font-medium">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="text-primary hover:underline"
                        >
                          {formatTicketKey(ticket.project.key, ticket.ticketNumber)}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <span className="block truncate">{ticket.title}</span>
                        <TicketLabelBadges
                          labels={ticket.labels.map((tl) => tl.label)}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge name={ticket.status.name} color={ticket.status.color} />
                      </TableCell>
                      <TableCell>{priorityLabels[ticket.priority]}</TableCell>
                      <TableCell>{ticketTypeLabels[ticket.type]}</TableCell>
                      <TableCell className="text-muted-foreground">{ticket.reporter.name}</TableCell>
                      <TableCell className={cn(overdue && "font-medium text-destructive")}>
                        {formatDueDate(ticket.dueDate)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatRelativeTime(ticket.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <TicketListPagination
            basePath="/my-tasks"
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={tickets.length}
            searchParams={params}
          />
        </>
      )}
    </div>
  );
}
