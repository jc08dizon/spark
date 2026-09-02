import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { NotificationBell } from "@/components/notification-bell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getRecentNotifications, getUnreadCount } from "@/lib/notifications-queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  if (!user || !session) {
    redirect("/login");
  }

  const [unreadCount, notifications] = await Promise.all([
    getUnreadCount(session),
    getRecentNotifications(session),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: user.name ?? user.email ?? "User",
          email: user.email ?? "",
          role: user.role,
        }}
      />
      <SidebarInset>
        <AppTopbar>
          <NotificationBell
            unreadCount={unreadCount}
            notifications={notifications.map((n) => ({
              id: n.id,
              message: n.message,
              isRead: n.isRead,
              createdAt: n.createdAt,
              ticketId: n.ticketId,
            }))}
          />
        </AppTopbar>
        <div className="flex min-w-0 flex-1 flex-col p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
