"use server";

import { auth } from "@/auth";
import { AiSummaryError, requestDashboardSummary, type DashboardSummary } from "@/lib/ai-summary";

export type DashboardSummaryState =
  | { ok: true; summary: DashboardSummary }
  | { ok: false; error: string }
  | undefined;

export async function generateDashboardSummaryAction(
  _prevState: DashboardSummaryState,
): Promise<DashboardSummaryState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "IT_OFFICER") {
    return { ok: false, error: "Not authorized." };
  }

  try {
    const summary = await requestDashboardSummary(session);
    return { ok: true, summary };
  } catch (error) {
    if (error instanceof AiSummaryError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Something went wrong generating the summary." };
  }
}
