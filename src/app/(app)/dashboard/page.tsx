import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AiSummaryPanel } from "@/components/dashboard/ai-summary-panel";
import { BreakdownBars } from "@/components/dashboard/breakdown-bars";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard-queries";
import { priorityLabels } from "@/lib/labels";
import { formatTicketKey } from "@/lib/tickets";
import { formatRelativeTime } from "@/lib/utils";

type TicketListRow = {
  id: string;
  ticketNumber: number;
  title: string;
  project: { key: string };
  status: { name: string; color: string };
  assignee: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getDashboardData(session);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        {data.role === "EMPLOYEE" && (
          <Button nativeButton={false} render={<Link href="/tickets/new">Create Ticket</Link>} />
        )}
      </div>
      {data.role === "IT_OFFICER" ? (
        <OfficerDashboard data={data} />
      ) : (
        <EmployeeDashboard data={data} />
      )}
    </div>
  );
}

function OfficerDashboard({
  data,
}: {
  data: Extract<Awaited<ReturnType<typeof getDashboardData>>, { role: "IT_OFFICER" }>;
}) {
  const workloadRows = [
    ...data.workload.map((o) => ({ label: o.name, count: o.openCount })),
    { label: "Unassigned", count: data.unassignedOpenCount },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open tickets" value={data.openCount} />
        <StatCard label="Unassigned (open)" value={data.unassignedOpenCount} />
        <StatCard label="Total tickets" value={data.totalCount} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Avg. first response"
          value={data.sla.avgFirstResponseDays === null ? "—" : `${data.sla.avgFirstResponseDays}d`}
        />
        <StatCard
          label="Avg. resolution time"
          value={data.sla.avgResolutionDays === null ? "—" : `${data.sla.avgResolutionDays}d`}
        />
        <StatCard label="Overdue tickets" value={data.sla.overdueCount} />
      </div>

      <AiSummaryPanel />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By status</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBars
              rows={data.statusBreakdown.map((s) => ({ label: s.name, count: s.count }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By priority</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBars
              rows={data.priorityBreakdown.map((p) => ({
                label: priorityLabels[p.priority],
                count: p.count,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workload (open tickets per officer)</CardTitle>
        </CardHeader>
        <CardContent>
          <BreakdownBars rows={workloadRows} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TicketListCard title="Recently updated" tickets={data.recentlyUpdated} />
        <TicketListCard title="Oldest unresolved" tickets={data.oldestUnresolved} />
      </div>
    </div>
  );
}

function EmployeeDashboard({
  data,
}: {
  data: Extract<Awaited<ReturnType<typeof getDashboardData>>, { role: "EMPLOYEE" }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="My open tickets" value={data.myOpenCount} />
        <StatCard label="My total tickets" value={data.myTotalCount} />
      </div>

      <TicketListCard title="My open tickets" tickets={data.myOpenTickets} />

      <Card>
        <CardHeader>
          <CardTitle>Recent activity on my tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.recentActivity.map((log) => (
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
                  on{" "}
                  <Link
                    href={`/tickets/${log.ticket.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {formatTicketKey(log.ticket.project.key, log.ticket.ticketNumber)}
                  </Link>{" "}
                  <span className="text-muted-foreground">
                    · {formatRelativeTime(log.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TicketListCard({
  title,
  tickets,
}: {
  title: string;
  tickets: TicketListRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="shrink-0 font-mono text-xs font-medium text-primary hover:underline"
                  >
                    {formatTicketKey(ticket.project.key, ticket.ticketNumber)}
                  </Link>
                  <span className="truncate text-foreground">{ticket.title}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge name={ticket.status.name} color={ticket.status.color} />
                  <span className="text-muted-foreground">
                    {formatRelativeTime(ticket.updatedAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
