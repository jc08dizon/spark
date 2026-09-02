import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Shared between every ticket-list page (All Tickets, My Tasks, ...) so
// status-chip and pagination behavior/markup stays identical across them.

export function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href}>
      <Badge
        variant={active ? "default" : "outline"}
        className={cn(!active && "text-muted-foreground hover:bg-secondary")}
      >
        {label}
      </Badge>
    </Link>
  );
}

// Drops "page" (a saved filter always starts fresh) and "any"/empty values —
// used both to build a saved-filter's stored query and to know whether
// there's anything worth saving.
export function buildFilterQueryString(searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || !value || value === "any") continue;
    params.set(key, value);
  }
  return params.toString();
}

function buildPageHref(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  page: number,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key !== "page" && value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function TicketListPagination({
  basePath,
  page,
  totalPages,
  total,
  pageSize,
  searchParams,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-sm text-muted-foreground">
        Showing {total} ticket{total === 1 ? "" : "s"}
      </p>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = start + pageSize - 1;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total} tickets
      </p>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={buildPageHref(basePath, searchParams, page - 1)} />}
          >
            Previous
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={buildPageHref(basePath, searchParams, page + 1)} />}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
