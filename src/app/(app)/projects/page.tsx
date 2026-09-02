import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listProjects } from "@/lib/projects-queries";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");

  const projects = await listProjects();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
        <Button
          nativeButton={false}
          render={<Link href="/projects/new">New Project</Link>}
        />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Key</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-mono text-xs font-medium">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-primary hover:underline"
                  >
                    {project.key}
                  </Link>
                </TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {project.lead?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {project._count.tickets}
                </TableCell>
                <TableCell>
                  <Badge variant={project.isActive ? "default" : "outline"}>
                    {project.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
