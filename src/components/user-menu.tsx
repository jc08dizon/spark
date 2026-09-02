"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(app)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  sidebarMenuButtonVariants,
} from "@/components/ui/sidebar";
import { cn, getInitials } from "@/lib/utils";

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: "IT_OFFICER" | "EMPLOYEE";
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  sidebarMenuButtonVariants({ size: "lg" }),
                  "text-left",
                )}
              >
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col text-left">
                  <span className="truncate text-sm font-medium">{name}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {role === "IT_OFFICER" ? "IT Officer" : "Employee"}
                  </span>
                </span>
              </button>
            }
          />
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => signOutAction()}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
