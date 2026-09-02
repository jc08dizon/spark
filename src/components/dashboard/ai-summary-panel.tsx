"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { generateDashboardSummaryAction } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AiSummaryPanel() {
  const [state, formAction, isPending] = useActionState(
    generateDashboardSummaryAction,
    undefined,
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>AI Summary</CardTitle>
        <form action={formAction}>
          <Button type="submit" size="sm" disabled={isPending}>
            <Sparkles data-icon="inline-start" />
            {isPending ? "Summarizing…" : "Summarize with AI"}
          </Button>
        </form>
      </CardHeader>
      {state ? (
        <CardContent>
          {state.ok ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-foreground">{state.summary.overview}</p>

              {state.summary.themes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium text-foreground">Themes</p>
                  <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
                    {state.summary.themes.map((theme, i) => (
                      <li key={i}>{theme}</li>
                    ))}
                  </ul>
                </div>
              )}

              {state.summary.needsAttention.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium text-foreground">Needs attention</p>
                  <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
                    {state.summary.needsAttention.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Generate a plain-language summary of ticket themes and what needs attention.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
