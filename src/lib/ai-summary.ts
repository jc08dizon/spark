import type { Session } from "next-auth";
import { getOfficerDashboard } from "@/lib/dashboard-queries";
import { categoryLabels, priorityLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatTicketKey } from "@/lib/tickets";
import { getTicketTimingBuckets } from "@/lib/ticket-timing";

export class AiSummaryError extends Error {}

export type DashboardSummary = {
  overview: string;
  themes: string[];
  needsAttention: string[];
};

const DIGEST_TICKET_LIMIT = 100;
const MODEL = "gpt-4o-mini";

// Officer-only, same gate as dashboard-queries.ts — this reads across all
// tickets (workload, aggregate counts), never scoped data an Employee
// session should ever reach.
async function buildDashboardDigest(session: Session) {
  if (session.user.role !== "IT_OFFICER") {
    throw new AiSummaryError("AI summary is only available to IT Officers.");
  }

  const tickets = await prisma.ticket.findMany({
    take: DIGEST_TICKET_LIMIT,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      ticketNumber: true,
      priority: true,
      category: true,
      createdAt: true,
      assigneeId: true,
      project: { select: { key: true } },
      status: { select: { name: true } },
    },
  });

  const buckets = await getTicketTimingBuckets(
    tickets.map((t) => ({
      id: t.id,
      createdAt: t.createdAt,
      statusName: t.status.name,
      assigneeId: t.assigneeId,
    })),
  );

  const officerData = await getOfficerDashboard();

  const aggregateLines = [
    `Open tickets: ${officerData.openCount}, unassigned open: ${officerData.unassignedOpenCount}, total: ${officerData.totalCount}`,
    `By status: ${officerData.statusBreakdown.map((s) => `${s.name}=${s.count}`).join(", ")}`,
    `By priority: ${officerData.priorityBreakdown.map((p) => `${priorityLabels[p.priority]}=${p.count}`).join(", ")}`,
    `Workload (open tickets per officer): ${officerData.workload.map((w) => `${w.name}=${w.openCount}`).join(", ")}, Unassigned=${officerData.unassignedOpenCount}`,
  ];

  // Titles only, never `description` — descriptions can carry sensitive
  // ticket detail (account info, incident specifics) that shouldn't leave
  // the app for a third-party API; titles are enough for topic clustering.
  const ticketLines = tickets.map((t) => {
    const bucket = buckets.get(t.id)!;
    const key = formatTicketKey(t.project.key, t.ticketNumber);
    const category = t.category ? categoryLabels[t.category] : "Uncategorized";
    const timing =
      bucket.kind === "cancelled"
        ? "cancelled"
        : bucket.kind === "resolved"
          ? `resolved in ${bucket.days}d`
          : bucket.kind === "in_progress"
            ? `in progress ${bucket.days}d since assignment`
            : bucket.kind === "waiting_on_reporter"
              ? `waiting on reporter, ${bucket.days}d`
              : `UNASSIGNED, waiting ${bucket.days}d`;
    return `${key} [${priorityLabels[t.priority]}, ${category}] "${t.title}" — ${timing}`;
  });

  return [...aggregateLines, "", "Tickets (most recently updated first):", ...ticketLines].join(
    "\n",
  );
}

const SYSTEM_PROMPT = `You summarize an internal IT helpdesk dashboard for an IT Officer.
You receive aggregate ticket counts and a list of recent tickets, each tagged with priority, category, title, and how long it has been in its current state.

Respond with three things:
1. overview: 1-2 sentences on overall ticket health right now.
2. themes: 2-5 short bullet points grouping tickets by common topic or category where a real pattern exists (e.g. "Several printer/hardware issues (3 tickets)"). Skip this if there's no clear pattern in fewer words than that.
3. needsAttention: the most urgent concrete items to act on now, referencing ticket keys. Prioritize tickets marked UNASSIGNED that have been waiting a long time, weighted by priority (an aging Urgent/High ticket matters far more than an aging Low one). Also flag tickets "in progress" for an unusually long time relative to the rest. Be specific and concrete, not generic advice.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    overview: { type: "string" },
    themes: { type: "array", items: { type: "string" } },
    needsAttention: { type: "array", items: { type: "string" } },
  },
  required: ["overview", "themes", "needsAttention"],
  additionalProperties: false,
} as const;

export async function requestDashboardSummary(session: Session): Promise<DashboardSummary> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AiSummaryError("OPENAI_API_KEY is not configured.");
  }

  const digest = await buildDashboardDigest(session);

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: digest },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "dashboard_summary", strict: true, schema: RESPONSE_SCHEMA },
        },
      }),
    });
  } catch {
    throw new AiSummaryError("Could not reach OpenAI. Check your network connection.");
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new AiSummaryError("OpenAI rejected the API key.");
    }
    if (response.status === 429) {
      throw new AiSummaryError("OpenAI rate limit hit — try again shortly.");
    }
    throw new AiSummaryError(`OpenAI request failed (${response.status}).`);
  }

  const body = await response.json();
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new AiSummaryError("OpenAI returned an unexpected response.");
  }

  try {
    return JSON.parse(content) as DashboardSummary;
  } catch {
    throw new AiSummaryError("Could not parse the AI summary response.");
  }
}
