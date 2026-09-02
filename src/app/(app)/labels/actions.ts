"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createLabelSchema, updateLabelSchema } from "@/lib/validation/label";

export type FormState = { error?: string } | undefined;

async function requireOfficer() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");
  return session;
}

export async function createLabelAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOfficer();

  const parsed = createLabelSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.label.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "A label with that name already exists." };

  await prisma.label.create({ data: parsed.data });

  revalidatePath("/labels");
  redirect("/labels");
}

export async function updateLabelAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOfficer();

  const parsed = updateLabelSchema.safeParse({
    labelId: formData.get("labelId"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.label.findUnique({ where: { name: parsed.data.name } });
  if (existing && existing.id !== parsed.data.labelId) {
    return { error: "A label with that name already exists." };
  }

  await prisma.label.update({
    where: { id: parsed.data.labelId },
    data: { name: parsed.data.name, color: parsed.data.color },
  });

  revalidatePath("/labels");
  redirect("/labels");
}

export async function deleteLabelAction(labelId: string): Promise<FormState> {
  await requireOfficer();

  // TicketLabel cascades — this silently untags whatever tickets had it,
  // which is fine for a lightweight tag with no historical significance.
  await prisma.label.delete({ where: { id: labelId } });

  revalidatePath("/labels");
  redirect("/labels");
}
