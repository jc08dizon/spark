import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listLabels } from "@/lib/labels-queries";

export default async function LabelsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "IT_OFFICER") redirect("/tickets");

  const labels = await listLabels();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Labels</h1>
        <Button nativeButton={false} render={<Link href="/labels/new">New Label</Link>} />
      </div>

      {labels.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">No labels yet.</p>
          <Button
            variant="secondary"
            nativeButton={false}
            render={<Link href="/labels/new">Create your first label</Link>}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tickets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labels.map((label) => (
                <TableRow key={label.id}>
                  <TableCell>
                    <Link
                      href={`/labels/${label.id}`}
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{label._count.tickets}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
