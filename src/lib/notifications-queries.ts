import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

// Notifications are always personal (userId scoped), so there's no
// cross-role leak risk the way ticket data has — still routed through
// session.user.id rather than any caller-supplied id.
export async function getUnreadCount(session: Session) {
  return prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });
}

export async function getRecentNotifications(session: Session, limit = 10) {
  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { ticket: { include: { project: { select: { key: true } } } } },
  });
}
