# S.P.A.R.K. — Project Notes (for the React/Next.js rebuild)

This captures the domain knowledge, decisions, and gotchas from the Laravel/Filament build of SPARK, so the rebuild doesn't have to re-derive them from scratch.

## What SPARK is

Support Platform for Assistance, Requests & Knowledge — an internal IT ticketing system for CIIT College of Arts and Technology. JIRA-inspired MVP: employees file tickets, IT Officers triage/resolve them.

## Roles and access model

Two roles: **IT Officer** and **Employee**. Deliberate design principle (came from an explicit client/user preference, not a technical constraint): **one shared login/entry point**, never separate login pages or portals per role — role differences should be expressed as conditional UI/data-scoping inside one app, not as separate auth flows. Carry this into the rebuild regardless of stack.

- IT Officers: see all tickets/projects/users, can edit tickets, assign, set priority/category, manage cancellation.
- Employees: only see their own tickets ("My Tickets"), a restricted create-ticket form (no assignee/priority/category fields — those are auto-set or hidden), and can cancel their own ticket with a reason.

## Data model

- **User**: name, email, password, `role` (enum: IT Officer / Employee), `department_id`.
- **Department**: name, optional department head (a User).
- **Project**: key (e.g. `ITSD`), name, description, lead, `is_active`, `next_ticket_number` counter.
- **Ticket**: title, description, `project_id`, `reporter_id`, `assignee_id` (nullable), `department_id`, `status_id`, `priority` (enum: Low/Medium/High/Urgent), `type` (enum: Incident/Service Request/Question), `category` (enum, ~10 values, IT-Officer-only field), `cancellation_reason` (nullable), `ticket_number` (per-project sequential). Displayed **key** (`ITSD-001`) is *computed*, never stored — `project.key + '-' + ticket_number` padded.
- **TicketStatus**: name, slug, color, sort_order, `is_closed` flag. Seeded set: Open, In Progress, Resolved, Closed, Reopened, Cancelled.
- **Comment**: ticket_id, author_id, body, timestamps.
- Activity log: tracks status/assignee/priority changes per ticket (for an audit trail tab).

## Key business rules

1. **Ticket key generation must be concurrency-safe.** Two tickets created in the same project at the same instant must never collide on `ticket_number`. The Laravel version did this with a row lock (`SELECT ... FOR UPDATE`) on the project row inside a transaction before incrementing the counter, backed by a unique `(project_id, ticket_number)` DB constraint as a last-resort guard. **Whatever backend the rebuild uses must replicate this locking, not just increment-and-hope** — this was explicitly stress-tested with real concurrent requests, not just unit tests, because naive increments *will* produce duplicate keys under load.
2. **Role-based query scoping, not just UI hiding.** Employees must be blocked at the query/API level from ever receiving another employee's ticket data — hiding fields in the UI alone is not sufficient.
3. **Ticket creation defaults**: project auto-assigned to the default project (`ITSD`) and not user-editable; reporter auto-set to the logged-in user for Employees (IT Officers can pick a reporter); assignee and priority are not exposed on create (only on edit, and only to IT Officers); category is IT-Officer-only; department auto-fills from the user's own department and is locked for Employees.
4. **Cancel, don't delete.** Tickets are never hard-deleted from the UI. Either the IT Officer or the original reporter can cancel a ticket, which requires a confirmation step and a required "reason for cancellation" text field, then flips status to a `Cancelled` status (not a physical delete). Already-cancelled/closed tickets shouldn't offer the cancel action again.
5. **In-app notifications only** — no email, no queue workers assumed. Notify on assignment, status change, and cancellation (to both reporter and assignee if one is set).
6. **Comments should read like a social feed** (avatar/initials + name + timestamp + body, chronological, no table/grid styling) — an early version used a plain data-table layout for comments and the client explicitly disliked it. Don't default to a table for comments in the rebuild.

## Branding / design system

CIIT official brand assets and palette (own these, don't reinvent):
- Logo: wordmark reading "CIIT" (dark navy `C`, sky-blue accent squares, dark navy `T` with cutout). Available cropped for both a wide (navbar) and square (favicon/icon) use.
- Primary palette: Dark Blue `#00364D`, Sky Blue `#47C7F4`, Blue `#005671`, Light Blue `#73CBE9`, Seafoam `#B3E3F3`, White, Dark Grey `#444444`, Grey `#AAAAAA`, Light Grey `#DADADA`. (A larger secondary palette — purple/pink/orange/green tones — exists in the client's brand doc but wasn't used in the ticketing UI; only pull those in if a future design pass calls for it.)
- Chrome (sidebar/topbar/nav) should read as dark-blue, with the rest of the UI staying light — not a full dark-mode toggle.
- Typography from the brand doc: Proxima Nova (logo only, not for body text unless flattened as an image), Orbitron and Montserrat also supplied as usable web fonts — none of these were actually wired into the Laravel build; that's still open for the rebuild.

## What was already scoped as "phase 2" (not yet built)

A custom Dashboard: KPI/chart widgets (ticket counts by status/priority, workload by officer), a "My Tasks" widget (tickets assigned to the logged-in officer), with the default framework-provided placeholder widgets removed. This was deliberately left out of the phase-1 client-feedback pass — worth including as a real requirement in the rebuild's initial scope rather than an afterthought.

## Client's working style (carry into the rebuild's process, not just the code)

- They review in rounds: a design doc with logo/palette/comments, expect the "comments" section addressed as concrete, verifiable changes — treat each comment as its own checklist item and confirm status against the actual running app, not just the code.
- Prefers being asked about ambiguous UI/UX choices (e.g., which logo variant, favicon handling) rather than having defaults silently chosen — but is fine with sensible recommended defaults when unresponsive.
- Sometimes edits assets themselves (cropping images, choosing final files) — expect to receive raw/imperfect source assets (wrong aspect ratio, untrimmed whitespace) and be ready to process them (crop/resize) rather than asking the client to pre-process everything.
