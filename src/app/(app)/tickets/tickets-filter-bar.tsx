import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryLabels, priorityLabels, ticketTypeLabels } from "@/lib/labels";
import { TICKET_SORT_OPTIONS } from "@/lib/tickets-queries";

const ANY = "any";

type AssigneeOption = { id: string; name: string };

// Plain GET form — no client JS required. Every select renders a native
// form-associated field (same mechanism ticket-form.tsx relies on for
// Server Actions), so submitting just navigates to /tickets?... with the
// chosen values, which the page parses server-side.
export function TicketsFilterBar({
  isOfficer,
  hideAssignee = false,
  basePath = "/tickets",
  assignees,
  labels,
  currentStatus,
  values,
  hasActiveFilters,
}: {
  isOfficer: boolean;
  /** My Tasks locks the assignee to the current officer server-side, so the picker doesn't make sense there. */
  hideAssignee?: boolean;
  basePath?: string;
  assignees: AssigneeOption[];
  labels: AssigneeOption[];
  currentStatus?: string;
  values: {
    q?: string;
    priority?: string;
    type?: string;
    category?: string;
    assignee?: string;
    label?: string;
    from?: string;
    to?: string;
    sort?: string;
  };
  hasActiveFilters: boolean;
}) {
  const priorityItems = [
    { value: ANY, label: "Any priority" },
    ...Object.entries(priorityLabels).map(([value, label]) => ({ value, label })),
  ];
  const typeItems = [
    { value: ANY, label: "Any type" },
    ...Object.entries(ticketTypeLabels).map(([value, label]) => ({ value, label })),
  ];
  const categoryItems = [
    { value: ANY, label: "Any category" },
    ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
  ];
  const assigneeItems = [
    { value: ANY, label: "Anyone" },
    { value: "unassigned", label: "Unassigned" },
    ...assignees.map((a) => ({ value: a.id, label: a.name })),
  ];
  const labelItems = [
    { value: ANY, label: "Any label" },
    ...labels.map((l) => ({ value: l.id, label: l.name })),
  ];
  const sortItems = Object.entries(TICKET_SORT_OPTIONS).map(([value, { label }]) => ({
    value,
    label,
  }));

  return (
    <form className="flex flex-wrap items-end gap-2">
      {currentStatus ? (
        <input type="hidden" name="status" value={currentStatus} />
      ) : null}

      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          defaultValue={values.q}
          placeholder="Title, description, or key (e.g. ITSD-7)"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Priority</Label>
        <Select name="priority" defaultValue={values.priority ?? ANY} items={priorityItems}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Type</Label>
        <Select name="type" defaultValue={values.type ?? ANY} items={typeItems}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isOfficer ? (
        <div className="flex flex-col gap-1">
          <Label>Category</Label>
          <Select name="category" defaultValue={values.category ?? ANY} items={categoryItems}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {isOfficer && !hideAssignee ? (
        <div className="flex flex-col gap-1">
          <Label>Assignee</Label>
          <Select name="assignee" defaultValue={values.assignee ?? ANY} items={assigneeItems}>
            <SelectTrigger className="w-40">
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
      ) : null}

      {labels.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Label>Label</Label>
          <Select name="label" defaultValue={values.label ?? ANY} items={labelItems}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {labelItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <Label htmlFor="from">From</Label>
        <Input id="from" name="from" type="date" defaultValue={values.from} className="w-36" />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="to">To</Label>
        <Input id="to" name="to" type="date" defaultValue={values.to} className="w-36" />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Sort</Label>
        <Select name="sort" defaultValue={values.sort ?? "created_desc"} items={sortItems}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortItems.map((item) => (
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
      {hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link href={currentStatus ? `${basePath}?status=${currentStatus}` : basePath} />
          }
        >
          Clear filters
        </Button>
      ) : null}
    </form>
  );
}
