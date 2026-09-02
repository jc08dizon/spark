"use client";

import { useActionState, useTransition } from "react";
import { deleteLabelAction, updateLabelAction } from "../actions";
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
import { Separator } from "@/components/ui/separator";
import { LABEL_COLOR_OPTIONS } from "@/lib/label-colors";

export function EditLabelForm({
  labelId,
  name,
  color,
}: {
  labelId: string;
  name: string;
  color: string;
}) {
  const [state, formAction, isPending] = useActionState(updateLabelAction, undefined);
  const [isDeleting, startDeleteTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="labelId" value={labelId} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={name} required maxLength={40} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="color">Color</Label>
          <Select name="color" defaultValue={color} items={LABEL_COLOR_OPTIONS}>
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
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      <Separator />

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Deleting a label removes it from every ticket it's attached to.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="w-fit"
          disabled={isDeleting}
          onClick={() =>
            startDeleteTransition(async () => {
              await deleteLabelAction(labelId);
            })
          }
        >
          {isDeleting ? "Deleting..." : "Delete Label"}
        </Button>
      </div>
    </div>
  );
}
