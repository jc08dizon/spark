import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOfficersForLeadPicker, getProjectById } from "@/lib/projects-queries";
import { EditProjectForm } from "./edit-project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");

  const { id } = await params;
  const [project, officers] = await Promise.all([
    getProjectById(id),
    getOfficersForLeadPicker(),
  ]);
  if (!project) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Edit Project</h1>
      <EditProjectForm
        projectId={project.id}
        keyValue={project.key}
        name={project.name}
        description={project.description}
        leadId={project.leadId}
        isActive={project.isActive}
        officers={officers}
      />
    </div>
  );
}
