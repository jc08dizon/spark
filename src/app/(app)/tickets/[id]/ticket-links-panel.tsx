"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ticketLinkTypeLabels } from "@/lib/labels";
import type { TicketLinkRow } from "@/lib/ticket-links";
import { addTicketLinkAction, removeTicketLinkAction } from "./ticket-links-actions";

const LINK_TYPE_ITEMS = Object.entries(ticketLinkTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

// BLOCKS is directional so it renders differently depending on which side
// of the link this ticket is on; DUPLICATES/RELATES_TO read the same
// either way (see ticketLinkTypeLabels doc comment).
function describeLink(link: TicketLinkRow): string {
  if (link.linkType === "BLOCKS") {
    return link.direction === "outgoing" ? "Blocks" : "Blocked by";
  }
  return ticketLinkTypeLabels[link.linkType];
}

export function TicketLinksPanel({
  ticketId,
  links,
  canEdit,
}: {
  ticketId: string;
  links: TicketLinkRow[];
  canEdit: boolean;
}) {
  const [key, setKey] = useState("");
  const [linkType, setLinkType] = useState<string>("DUPLICATES");
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  function handleAdd() {
    if (!key.trim()) return;
    startTransition(async () => {
      const result = await addTicketLinkAction({
        ticketId,
        key,
        linkType,
      });
      if (result.ok) {
        toast.success("Ticket linked");
        setKey("");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(linkId: string) {
    setRemovingId(linkId);
    startTransition(async () => {
      const result = await removeTicketLinkAction(ticketId, linkId);
      if (result.ok) {
        toast.success("Link removed");
      } else {
        toast.error(result.error);
      }
      setRemovingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        Linked tickets{links.length > 0 ? ` (${links.length})` : ""}
      </h2>

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">No linked tickets.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-muted-foreground">{describeLink(link)}</span>
                <Link
                  href={`/tickets/${link.otherTicket.id}`}
                  className="font-mono text-xs font-medium text-primary hover:underline"
                >
                  {link.otherTicket.key}
                </Link>
                <span className="truncate text-foreground">{link.otherTicket.title}</span>
                <StatusBadge
                  name={link.otherTicket.status.name}
                  color={link.otherTicket.status.color}
                />
              </div>
              {canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isPending && removingId === link.id}
                  onClick={() => handleRemove(link.id)}
                  aria-label="Remove link"
                >
                  <X />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-40 flex-1 flex-col gap-1">
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Ticket key, e.g. ITSD-7"
              disabled={isPending}
            />
          </div>
          <Select value={linkType} onValueChange={(v) => v && setLinkType(v)} items={LINK_TYPE_ITEMS}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINK_TYPE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={handleAdd} disabled={isPending || !key.trim()}>
            Add link
          </Button>
        </div>
      ) : null}
    </div>
  );
}
