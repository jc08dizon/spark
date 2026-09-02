"use client";

import { useActionState } from "react";
import { updateProjectAction } from "../actions";
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

export function EditProjectForm({
  projectId,
  keyValue,
  name,
  description,
  leadId,
  isActive,
  officers,
}: {
  projectId: string;
  keyValue: string;
  name: string;
  description: string | null;
  leadId: string | null;
  isActive: boolean;
  officers: OfficerOption[];
}) {
  const [state, formAction, isPending] = useActionState(updateProjectAction, undefined);

  const leadItems = officers.map((o) => ({ value: o.id, label: o.name }));
  const statusItems = [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="key-display">Key</Label>
        <Input id="key-display" value={keyValue} disabled readOnly className="font-mono" />
        <p className="text-xs text-muted-foreground">
          Locked — already baked into existing ticket keys.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={name} required maxLength={200} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={description ?? ""}
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="leadId">Lead</Label>
        <Select name="leadId" defaultValue={leadId ?? undefined} items={leadItems}>
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="isActive">Status</Label>
        <Select
          name="isActive"
          defaultValue={isActive ? "true" : "false"}
          items={statusItems}
        >
          <SelectTrigger id="isActive" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusItems.map((item) => (
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
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
