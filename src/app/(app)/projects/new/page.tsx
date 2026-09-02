import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOfficersForLeadPicker } from "@/lib/projects-queries";
import { ProjectForm } from "./project-form";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");

  const officers = await getOfficersForLeadPicker();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">New Project</h1>
      <ProjectForm officers={officers} />
    </div>
  );
}
