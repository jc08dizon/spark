import {
  ClipboardList,
  Kanban,
  LayoutDashboard,
  LayoutList,
  PlusCircle,
  Users,
  FolderKanban,
  Tags,
} from "lucide-react";
import type { Role } from "@/generated/prisma/client";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutList;
};

export function getNavItems(role: Role): NavItem[] {
  const items: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  if (role === "IT_OFFICER") {
    items.push(
      { label: "My Tasks", href: "/my-tasks", icon: ClipboardList },
      { label: "Board", href: "/board", icon: Kanban },
    );
  }

  items.push(
    {
      label: role === "IT_OFFICER" ? "All Tickets" : "My Tickets",
      href: "/tickets",
      icon: LayoutList,
    },
    { label: "New Ticket", href: "/tickets/new", icon: PlusCircle },
  );

  if (role === "IT_OFFICER") {
    items.push(
      { label: "Users", href: "/users", icon: Users },
      { label: "Projects", href: "/projects", icon: FolderKanban },
      { label: "Labels", href: "/labels", icon: Tags },
    );
  }

  return items;
}
