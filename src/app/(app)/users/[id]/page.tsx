import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllDepartments, getUserById } from "@/lib/users-queries";
import { EditUserForm } from "./edit-user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");

  const { id } = await params;
  const [user, departments] = await Promise.all([
    getUserById(id),
    getAllDepartments(),
  ]);
  if (!user) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Edit User</h1>
      <EditUserForm
        userId={user.id}
        email={user.email}
        name={user.name}
        role={user.role}
        departmentId={user.departmentId}
        departments={departments}
      />
    </div>
  );
}
