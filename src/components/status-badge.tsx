import { Badge } from "@/components/ui/badge";

// TicketStatus.color is an arbitrary hex from the DB, so we render a colored
// dot + neutral text instead of tinting the whole badge — keeps contrast
// safe for both light (seafoam) and dark (navy) status colors.
export function StatusBadge({ name, color }: { name: string; color: string }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </Badge>
  );
}
