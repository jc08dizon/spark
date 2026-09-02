import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatTicketKey } from "@/lib/tickets";
import { getTicketById } from "@/lib/tickets-queries";
import { getCurrentUserProfile, getReporterOptions } from "@/lib/users-queries";
import { TicketForm } from "./ticket-form";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ reopenFrom?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isOfficer = session.user.role === "IT_OFFICER";
  const { reopenFrom } = await searchParams;
  const [profile, reporters, reopenFromTicket] = await Promise.all([
    getCurrentUserProfile(session),
    getReporterOptions(session),
    reopenFrom ? getTicketById(session, reopenFrom) : Promise.resolve(null),
  ]);

  // Only prefill for the original ticket's own reporter — anything else
  // (someone else's ticket, a stale id) is silently treated as a plain new
  // ticket rather than an error, since this is just a convenience prefill.
  const reopenFromValid =
    reopenFromTicket && reopenFromTicket.reporterId === session.user.id
      ? reopenFromTicket
      : null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">New Ticket</h1>
      {reopenFromValid ? (
        <p className="mb-6 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          Filing a follow-up to{" "}
          {formatTicketKey(reopenFromValid.project.key, reopenFromValid.ticketNumber)} — the
          new ticket will be linked back to it.
        </p>
      ) : null}
      <TicketForm
        isOfficer={isOfficer}
        currentUserId={session.user.id}
        departmentName={profile?.department?.name ?? null}
        reporters={reporters}
        initialTitle={reopenFromValid ? `Re: ${reopenFromValid.title}` : undefined}
        reopenFromTicketId={reopenFromValid?.id}
      />
    </div>
  );
}
