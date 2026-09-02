"use client";

import { useActionState } from "react";
import { updateUserAction } from "../actions";
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
import { roleLabels } from "@/lib/labels";
import type { Role } from "@/generated/prisma/client";

type DepartmentOption = { id: string; name: string };

export function EditUserForm({
  userId,
  email,
  name,
  role,
  departmentId,
  departments,
}: {
  userId: string;
  email: string;
  name: string;
  role: Role;
  departmentId: string | null;
  departments: DepartmentOption[];
}) {
  const [state, formAction, isPending] = useActionState(updateUserAction, undefined);

  const roleItems = Object.entries(roleLabels).map(([value, label]) => ({
    value,
    label,
  }));
  const departmentItems = departments.map((d) => ({ value: d.id, label: d.name }));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="userId" value={userId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email-display">Email</Label>
        <Input id="email-display" value={email} disabled readOnly />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={name} required maxLength={200} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Role</Label>
        <Select name="role" defaultValue={role} items={roleItems}>
          <SelectTrigger id="role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="departmentId">Department</Label>
        <Select
          name="departmentId"
          defaultValue={departmentId ?? undefined}
          items={departmentItems}
        >
          <SelectTrigger id="departmentId" className="w-full">
            <SelectValue placeholder="Select a department" />
          </SelectTrigger>
          <SelectContent>
            {departmentItems.map((item) => (
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
