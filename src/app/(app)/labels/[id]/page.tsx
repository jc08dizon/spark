import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLabelById } from "@/lib/labels-queries";
import { EditLabelForm } from "./edit-label-form";

export default async function EditLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");

  const { id } = await params;
  const label = await getLabelById(id);
  if (!label) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Edit Label</h1>
      <EditLabelForm labelId={label.id} name={label.name} color={label.color} />
    </div>
  );
}
