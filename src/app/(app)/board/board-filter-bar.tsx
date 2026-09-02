import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ANY = "any";

type AssigneeOption = { id: string; name: string };

// Plain GET form, same convention as TicketsFilterBar — submitting
// navigates to /board?assignee=... which the page parses server-side.
export function BoardFilterBar({
  assignees,
  currentAssignee,
}: {
  assignees: AssigneeOption[];
  currentAssignee?: string;
}) {
  const assigneeItems = [
    { value: ANY, label: "Anyone" },
    { value: "unassigned", label: "Unassigned" },
    ...assignees.map((a) => ({ value: a.id, label: a.name })),
  ];
  const hasFilter = !!currentAssignee && currentAssignee !== ANY;

  return (
    <form className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label>Assignee</Label>
        <Select name="assignee" defaultValue={currentAssignee ?? ANY} items={assigneeItems}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {assigneeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" size="sm">
        Apply
      </Button>
      {hasFilter ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/board" />}
        >
          Clear filter
        </Button>
      ) : null}
    </form>
  );
}
