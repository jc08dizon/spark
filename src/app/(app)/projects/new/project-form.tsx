"use client";

import { useActionState } from "react";
import { createProjectAction } from "../actions";
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
import { Textarea } from "@/components/ui/textarea";

type OfficerOption = { id: string; name: string };

export function ProjectForm({ officers }: { officers: OfficerOption[] }) {
  const [state, formAction, isPending] = useActionState(createProjectAction, undefined);

  const leadItems = officers.map((o) => ({ value: o.id, label: o.name }));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="key">Key</Label>
        <Input
          id="key"
          name="key"
          required
          maxLength={10}
          placeholder="e.g. ITSD"
          className="uppercase"
          style={{ textTransform: "uppercase" }}
        />
        <p className="text-xs text-muted-foreground">
          2-10 uppercase letters. This is baked into every ticket&apos;s key
          (e.g. {`{KEY}`}-001) and can&apos;t be changed later.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required maxLength={200} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} maxLength={2000} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="leadId">Lead</Label>
        <Select name="leadId" items={leadItems}>
          <SelectTrigger id="leadId" className="w-full">
            <SelectValue placeholder="Select a lead (optional)" />
          </SelectTrigger>
          <SelectContent>
            {leadItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
