import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LabelForm } from "./label-form";

export default async function NewLabelPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">New Label</h1>
      <LabelForm />
    </div>
  );
}
