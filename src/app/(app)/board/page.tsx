import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllTicketStatuses, getTicketsForBoard } from "@/lib/tickets-queries";
import { getAssignableUsers } from "@/lib/users-queries";
import { BoardColumns } from "./board-columns";
import { BoardFilterBar } from "./board-filter-bar";

type SearchParams = { assignee?: string };

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");

  const params = await searchParams;
  const assigneeId = params.assignee && params.assignee !== "any" ? params.assignee : undefined;

  const [statuses, tickets, assignees] = await Promise.all([
    getAllTicketStatuses(),
    getTicketsForBoard(session, { assigneeId }),
    getAssignableUsers(session),
  ]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Board</h1>
      </div>

      <BoardFilterBar assignees={assignees} currentAssignee={params.assignee} />

      <BoardColumns statuses={statuses} tickets={tickets} />
    </div>
  );
}
