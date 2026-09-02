import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllDepartments } from "@/lib/users-queries";
import { UserForm } from "./user-form";

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");

  const departments = await getAllDepartments();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">New User</h1>
      <UserForm departments={departments} />
    </div>
  );
}
