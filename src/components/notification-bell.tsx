"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(app)/actions";

type NotificationItem = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  ticketId: string | null;
};

// Server-rendered on page load/nav (data comes from the layout's fetch,
// passed down as props) — no polling or websockets, per the "in-app
// notifications only" business rule.
export function NotificationBell({
  unreadCount,
  notifications,
}: {
  unreadCount: number;
  notifications: NotificationItem[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell />
            {unreadCount > 0 ? (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            ) : null}
            <span className="sr-only">Notifications</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <div className="flex items-center justify-between px-1.5 py-1">
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => markAllNotificationsReadAction()}
              >
                Mark all read
              </button>
            ) : null}
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <DropdownMenuGroup>
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex-col items-start gap-0.5 whitespace-normal"
                onClick={() => {
                  if (!n.isRead) markNotificationReadAction(n.id);
                }}
                render={
                  n.ticketId ? (
                    <Link href={`/tickets/${n.ticketId}`} />
                  ) : undefined
                }
              >
                <span className="flex w-full items-start gap-1.5">
                  {!n.isRead && (
                    <span
                      aria-hidden
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                    />
                  )}
                  <span className={n.isRead ? "text-muted-foreground" : ""}>
                    {n.message}
                  </span>
                </span>
                <span className="pl-3 text-xs text-muted-foreground">
                  {formatRelativeTime(n.createdAt)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
