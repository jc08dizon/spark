"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveFilterSchema } from "@/lib/validation/saved-filter";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function markNotificationReadAction(notificationId: string) {
  const session = await auth();
  if (!session?.user) return;

  // updateMany + userId filter (not update-by-id) so a user can't mark
  // someone else's notification as read by guessing an id.
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { isRead: true },
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/", "layout");
}

export type SavedFilterActionResult = { ok: true } | { ok: false; error: string };

// Personal convenience feature — any authenticated user can save a filter
// view for their own /tickets or /my-tasks, scoped to their own userId.
export async function saveFilterAction(input: unknown): Promise<SavedFilterActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };

  const parsed = saveFilterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.savedFilter.findUnique({
    where: {
      userId_basePath_name: {
        userId: session.user.id,
        basePath: parsed.data.basePath,
        name: parsed.data.name,
      },
    },
  });
  if (existing) return { ok: false, error: "You already have a saved filter with that name." };

  await prisma.savedFilter.create({
    data: {
      userId: session.user.id,
      basePath: parsed.data.basePath,
      name: parsed.data.name,
      query: parsed.data.query,
    },
  });
  revalidatePath(parsed.data.basePath);
  return { ok: true };
}

export async function deleteSavedFilterAction(
  savedFilterId: string,
): Promise<SavedFilterActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };

  // deleteMany + userId filter (not delete-by-id) so a user can't delete
  // someone else's saved filter by guessing an id.
  const result = await prisma.savedFilter.deleteMany({
    where: { id: savedFilterId, userId: session.user.id },
  });
  if (result.count === 0) return { ok: false, error: "Saved filter not found." };

  revalidatePath("/tickets");
  revalidatePath("/my-tasks");
  return { ok: true };
}
