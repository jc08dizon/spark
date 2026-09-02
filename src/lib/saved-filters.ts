import { prisma } from "@/lib/prisma";

export async function listSavedFilters(userId: string, basePath: string) {
  return prisma.savedFilter.findMany({
    where: { userId, basePath },
    select: { id: true, name: true, query: true },
    orderBy: { name: "asc" },
  });
}
