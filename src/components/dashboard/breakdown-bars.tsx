import { cn } from "@/lib/utils";

const BAR_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

export function BreakdownBars({
  rows,
}: {
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={row.label} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 truncate text-muted-foreground">
            {row.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", BAR_COLORS[i % BAR_COLORS.length])}
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right font-medium text-foreground">
            {row.count}
          </span>
        </div>
      ))}
    </div>
  );
}
