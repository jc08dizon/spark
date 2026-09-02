"use client";

import { useActionState } from "react";
import { createTicketAction } from "./actions";
import { AttachmentsField } from "@/app/(app)/tickets/attachments-field";
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
import { categoryLabels, ticketTypeLabels } from "@/lib/labels";

type ReporterOption = { id: string; name: string; email: string };

export function TicketForm({
  isOfficer,
  currentUserId,
  departmentName,
  reporters,
  initialTitle,
  reopenFromTicketId,
}: {
  isOfficer: boolean;
  currentUserId: string;
  departmentName: string | null;
  reporters: ReporterOption[];
  initialTitle?: string;
  reopenFromTicketId?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createTicketAction,
    undefined,
  );

  const typeItems = Object.entries(ticketTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));
  const categoryItems = Object.entries(categoryLabels).map(
    ([value, label]) => ({ value, label }),
  );
  const reporterItems = reporters.map((r) => ({
    value: r.id,
    label: `${r.name} (${r.email})`,
  }));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {reopenFromTicketId ? (
        <input type="hidden" name="reopenFromTicketId" value={reopenFromTicketId} />
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={initialTitle}
          placeholder="Short summary of the issue or request"
        />
        <FieldError message={state?.fieldErrors?.title} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={6}
          placeholder="What happened? Where? Since when? Include any error messages."
        />
        <FieldError message={state?.fieldErrors?.description} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Type</Label>
        <Select name="type" defaultValue="INCIDENT" items={typeItems}>
          <SelectTrigger id="type" className="w-full">
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
        <FieldError message={state?.fieldErrors?.type} />
      </div>

      {isOfficer && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" items={categoryItems}>
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Select a category (optional)" />
            </SelectTrigger>
            <SelectContent>
              {categoryItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={state?.fieldErrors?.category} />
        </div>
      )}

      {isOfficer ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="reporterId">Reporter</Label>
          <Select
            name="reporterId"
            defaultValue={currentUserId}
            items={reporterItems}
          >
            <SelectTrigger id="reporterId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reporterItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            The ticket&apos;s department is set from the reporter&apos;s own
            department.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="department-display">Department</Label>
          <Input
            id="department-display"
            value={departmentName ?? "No department assigned"}
            disabled
            readOnly
          />
          <p className="text-xs text-muted-foreground">
            Auto-filled from your profile.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>Attachments</Label>
        <AttachmentsField name="attachments" />
      </div>

      {state?.formError ? (
        <p className="text-sm text-destructive">{state.formError}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Ticket"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
