"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createProjectSchema, updateProjectSchema } from "@/lib/validation/project";

export type FormState = { error?: string } | undefined;

async function requireOfficer() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");
  return session;
}

export async function createProjectAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOfficer();

  const parsed = createProjectSchema.safeParse({
    key: (formData.get("key") as string | null)?.toUpperCase(),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    leadId: formData.get("leadId") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.project.findUnique({
    where: { key: parsed.data.key },
  });
  if (existing) return { error: "A project with that key already exists." };

  await prisma.project.create({
    data: {
      key: parsed.data.key,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      leadId: parsed.data.leadId,
      isActive: true,
      nextTicketNumber: 1,
    },
  });

  revalidatePath("/projects");
  redirect("/projects");
}

export async function updateProjectAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOfficer();

  const parsed = updateProjectSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    leadId: formData.get("leadId") || null,
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // key and nextTicketNumber are intentionally never accepted here — key is
  // baked into every existing ticket's displayed key, and nextTicketNumber
  // is only ever advanced by createTicketWithKey's locked transaction.
  await prisma.project.update({
    where: { id: parsed.data.projectId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      leadId: parsed.data.leadId,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/projects");
  redirect("/projects");
}
