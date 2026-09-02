"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { updateTicketFieldAction } from "@/app/(app)/tickets/[id]/actions";
import { priorityLabels } from "@/lib/labels";
import { formatTicketKey, isTicketOverdue } from "@/lib/tickets";
import type { TicketListItem } from "@/lib/tickets-queries";

type BoardStatus = {
  id: string;
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  isClosed: boolean;
};

// A plain click (no real pointer movement) still needs to pass through to
// the card's Link — only a drag past this distance should pick the card up.
const ACTIVATION_DISTANCE = 8;

export function BoardColumns({
  statuses,
  tickets,
}: {
  statuses: BoardStatus[];
  tickets: TicketListItem[];
}) {
  const [ticketsByStatus, setTicketsByStatus] = useState(() => groupByStatus(tickets, statuses));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: ACTIVATION_DISTANCE } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const targetStatusId = over.id as string;

    const sourceStatusId = Object.keys(ticketsByStatus).find((statusId) =>
      ticketsByStatus[statusId].some((t) => t.id === ticketId),
    );
    if (!sourceStatusId || sourceStatusId === targetStatusId) return;

    const moving = ticketsByStatus[sourceStatusId].find((t) => t.id === ticketId);
    if (!moving) return;

    const previous = ticketsByStatus;
    setTicketsByStatus({
      ...previous,
      [sourceStatusId]: previous[sourceStatusId].filter((t) => t.id !== ticketId),
      [targetStatusId]: [...previous[targetStatusId], moving],
    });

    updateTicketFieldAction({ ticketId, field: "statusId", value: targetStatusId }).then(
      (result) => {
        if (result.ok) {
          toast.success("Ticket updated");
        } else {
          setTicketsByStatus(previous);
          toast.error(result.error);
        }
      },
    );
  }

  return (
    <DndContext id="board-dnd" sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
        {statuses.map((status) => (
          <BoardColumn key={status.id} status={status} tickets={ticketsByStatus[status.id] ?? []} />
        ))}
      </div>
    </DndContext>
  );
}

function groupByStatus(
  tickets: TicketListItem[],
  statuses: BoardStatus[],
): Record<string, TicketListItem[]> {
  const grouped: Record<string, TicketListItem[]> = {};
  for (const status of statuses) grouped[status.id] = [];
  for (const ticket of tickets) {
    (grouped[ticket.statusId] ??= []).push(ticket);
  }
  return grouped;
}

function BoardColumn({ status, tickets }: { status: BoardStatus; tickets: TicketListItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/20 p-2 ${
        isOver ? "bg-muted/50" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-1 py-1">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: status.color }}
        />
        <h2 className="text-sm font-medium text-foreground">{status.name}</h2>
        <span className="text-xs text-muted-foreground">{tickets.length}</span>
      </div>

      <div className="flex flex-col gap-2">
        {tickets.map((ticket) => (
          <BoardCard key={ticket.id} ticket={ticket} />
        ))}
        {tickets.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            No tickets
          </p>
        ) : null}
      </div>
    </div>
  );
}

function BoardCard({ ticket }: { ticket: TicketListItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  });
  const overdue = useMemo(
    () => isTicketOverdue(ticket.dueDate, ticket.status.isClosed),
    [ticket.dueDate, ticket.status.isClosed],
  );

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex flex-col gap-1.5 rounded-md border border-border bg-background p-2.5 shadow-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/tickets/${ticket.id}`}
          className="font-mono text-xs font-medium text-primary hover:underline"
        >
          {formatTicketKey(ticket.project.key, ticket.ticketNumber)}
        </Link>
        {overdue ? (
          <Badge variant="destructive" className="text-[0.65rem]">
            Overdue
          </Badge>
        ) : null}
      </div>
      <Link href={`/tickets/${ticket.id}`} className="line-clamp-2 text-sm text-foreground">
        {ticket.title}
      </Link>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{priorityLabels[ticket.priority]}</span>
        <span className="truncate">{ticket.assignee?.name ?? "Unassigned"}</span>
      </div>
    </div>
  );
}
