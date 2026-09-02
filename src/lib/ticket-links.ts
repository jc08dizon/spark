import type { TicketLinkType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { formatTicketKey } from "@/lib/tickets";

const KEY_PATTERN = /^([A-Za-z]+)-(\d+)$/;

// Same key format as ticket search ("ITSD-7", "itsd-007"), but resolves to
// an actual ticket row rather than a search filter.
export async function findTicketByKey(key: string) {
  const match = key.trim().match(KEY_PATTERN);
  if (!match) return null;

  const [, projectKey, numberStr] = match;
  return prisma.ticket.findFirst({
    where: {
      ticketNumber: parseInt(numberStr, 10),
      project: { key: { equals: projectKey, mode: "insensitive" } },
    },
    include: { project: { select: { key: true } } },
  });
}

export type TicketLinkRow = {
  id: string;
  linkType: TicketLinkType;
  direction: "outgoing" | "incoming";
  otherTicket: {
    id: string;
    key: string;
    title: string;
    status: { name: string; color: string };
  };
};

export async function getTicketLinks(ticketId: string): Promise<TicketLinkRow[]> {
  const links = await prisma.ticketLink.findMany({
    where: { OR: [{ sourceId: ticketId }, { targetId: ticketId }] },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          ticketNumber: true,
          project: { select: { key: true } },
          status: { select: { name: true, color: true } },
        },
      },
      target: {
        select: {
          id: true,
          title: true,
          ticketNumber: true,
          project: { select: { key: true } },
          status: { select: { name: true, color: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return links.map((link) => {
    const isSource = link.sourceId === ticketId;
    const other = isSource ? link.target : link.source;
    return {
      id: link.id,
      linkType: link.linkType,
      direction: isSource ? "outgoing" : "incoming",
      otherTicket: {
        id: other.id,
        key: formatTicketKey(other.project.key, other.ticketNumber),
        title: other.title,
        status: other.status,
      },
    };
  });
}
