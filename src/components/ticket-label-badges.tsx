import { Badge } from "@/components/ui/badge";

export function TicketLabelBadges({
  labels,
}: {
  labels: { id: string; name: string; color: string }[];
}) {
  if (labels.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <Badge key={label.id} variant="outline" className="gap-1 text-xs">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: label.color }}
          />
          {label.name}
        </Badge>
      ))}
    </div>
  );
}
