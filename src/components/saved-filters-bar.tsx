"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";
import { deleteSavedFilterAction, saveFilterAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SavedFilter = { id: string; name: string; query: string };

// Personal convenience feature (not admin/structural) — available to
// whoever's viewing a ticket list, Officer or Employee, scoped to their own
// saved filters for this basePath.
export function SavedFiltersBar({
  basePath,
  savedFilters,
  currentQuery,
}: {
  basePath: "/tickets" | "/my-tasks";
  savedFilters: SavedFilter[];
  currentQuery: string;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await saveFilterAction({ basePath, name, query: currentQuery });
      if (result.ok) {
        toast.success("Filter saved");
        setName("");
        setIsSaving(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteSavedFilterAction(id);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {savedFilters.map((filter) => (
        <div
          key={filter.id}
          className="flex items-center gap-1 rounded-full border border-border py-0.5 pr-1 pl-3 text-sm"
        >
          <Link href={`${basePath}?${filter.query}`} className="text-foreground hover:underline">
            {filter.name}
          </Link>
          <button
            type="button"
            aria-label={`Delete saved filter ${filter.name}`}
            disabled={isPending}
            onClick={() => handleDelete(filter.id)}
            className="rounded-full p-0.5 hover:bg-muted"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}

      {isSaving ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Filter name"
            className="h-7 w-36 text-sm"
          />
          <Button type="button" size="sm" disabled={isPending || !name.trim()} onClick={handleSave}>
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsSaving(false);
              setName("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={() => setIsSaving(true)}>
          Save current view
        </Button>
      )}
    </div>
  );
}
