"use client";

import { useActionState } from "react";
import { createLabelAction } from "../actions";
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
import { DEFAULT_LABEL_COLOR, LABEL_COLOR_OPTIONS } from "@/lib/label-colors";

export function LabelForm() {
  const [state, formAction, isPending] = useActionState(createLabelAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required maxLength={40} placeholder="e.g. Recurring" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="color">Color</Label>
        <Select name="color" defaultValue={DEFAULT_LABEL_COLOR} items={LABEL_COLOR_OPTIONS}>
          <SelectTrigger id="color" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LABEL_COLOR_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.value }}
                  />
                  {item.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Label"}
        </Button>
      </div>
    </form>
  );
}
