# SPARK Feature Roadmap

Gap analysis vs. JIRA, sorted by priority. Each milestone is a shippable unit —
finish one, demo it, move to the next. Nothing below is started until the
milestone above it is done (or consciously skipped).

**Status as of 2026-07-07: Milestones 1–7 are done.** They landed together
rather than strictly one-at-a-time — see each milestone below for what
shipped. **Milestone 8 (Kanban board) is next up.**

Current baseline (already built): shared login + roles, role-scoped ticket list,
create/view ticket, status/assignee/priority/category editing, cancel-with-reason,
comments feed, activity log, in-app notifications, projects/users/departments CRUD,
attachments, search/filter/sort/pagination, title/description editing,
watchers + @mentions, officer/employee dashboard (incl. an AI-generated summary
and SLA metrics for officers), an officer-only "My Tasks" queue,
due dates/overdue highlighting/response & resolution time tracking, ticket
linking (duplicates/relates-to/blocks), officer-managed labels (filterable,
with a full admin page at /labels), and saved filters per user.

---

## Milestone 1 — Attachments  ✅ done

The single most-felt gap. IT tickets live and die by screenshots.

**Scope**
- New `Attachment` model: `id`, `ticketId`, `commentId?` (nullable — an
  attachment belongs to the ticket, optionally anchored to a comment),
  `uploaderId`, `filename`, `mimeType`, `size`, `storagePath`, `createdAt`.
- Upload on the **new ticket form** (multi-file) and on the **comment form**.
- Attachment list section on the ticket detail page; inline thumbnail preview
  for images, download link for everything else.
- Storage: local disk under an app-managed uploads dir, served through a
  route handler that re-checks ticket access (never a public folder —
  role scoping must apply to files too).
- Limits: allowlist of types (images, pdf, docx/xlsx, txt, zip), max size
  (e.g. 10 MB/file, 5 files per upload), validated server-side.
- Activity log entry when an attachment is added or removed.
- Employees can delete their own attachments while ticket is open; officers
  can delete any (soft-delete not needed — log it in activity instead).

**Out of scope:** virus scanning, image resizing, external storage (S3 etc.).
Revisit storage only if deployment target can't persist a disk.

---

## Milestone 2 — Find things: search, filters, sorting, pagination  ✅ done

Second most-felt gap. Today the list has status chips only and renders every
row unpaginated — this breaks down as soon as real data accumulates.

**Scope**
- Text search box on the ticket list: matches title, description, and ticket
  key (`ITSD-12`). Server-side, case-insensitive, debounced on the client.
- Filter controls: priority, type, assignee, project, category (officer only),
  date range. All expressed as URL search params so views are shareable/
  bookmarkable — this is the JIRA-filter-URL behavior, and it keeps
  everything server-rendered.
- Sortable columns: created, updated, priority, status.
- Pagination (page size ~25) with total count.
- All of it layered on the existing role-scoped query in
  `src/lib/tickets-queries.ts` — scoping stays at the query level per the
  established business rule.

**Out of scope:** saved filters (Milestone 7), full-text index/ranking —
Postgres `ILIKE` is fine at this scale.

---

## Milestone 3 — Ticket editing: title & description  ✅ done

Reporters who typo a title or need to add repro details currently have no
path besides comments. In JIRA everything is inline-editable.

**Scope**
- Edit title + description on the ticket detail page (reporter while ticket
  is open, or any officer), reusing the existing edit-shell pattern.
- Activity log entries for both (store a truncated old/new value for
  description, or just "description updated").
- Blocked on closed/cancelled tickets.

Small milestone by design — it can ride along with Milestone 2 if convenient.

---

## Milestone 4 — Notifications v2: watchers + @mentions  ✅ done

Turns notifications from "things that happened to me" into "things I care
about." One join table plus hooks into writes that already exist.

**Scope**
- `TicketWatcher` join table (`ticketId`, `userId`, unique pair).
- Auto-watch: reporter and assignee are watchers by default; watch/unwatch
  button on ticket detail for anyone who can see the ticket.
- Existing notification writes (assigned / status changed / cancelled) fan
  out to watchers, plus new type: `COMMENTED`.
- `@mentions` in comments: simple `@Full Name` autocomplete in the comment
  box; mention creates a notification (`MENTIONED`) and auto-adds the
  mentioned user as a watcher. Mentioned user must already have ticket
  visibility — no permission escalation via mention.
- Render comment bodies with mentions highlighted. (Full markdown deferred —
  see Milestone 8.)

---

## Milestone 5 — Dashboard  ✅ done (already-promised phase 2)

The client-facing "wow" milestone; JIRA's landing experience. Pull forward
per project notes rather than leaving it an afterthought.

**Scope**
- Officer dashboard: ticket counts by status and priority, open tickets per
  officer (workload), recently updated, oldest unresolved.
- Employee dashboard: "My open tickets", recent activity on my tickets.
- KPI cards + one or two simple charts; no framework placeholder widgets
  (explicit client requirement from the Laravel build).
- Queries live in a `dashboard-queries.ts`, reusing role scoping.

**Do together with Milestone 6 planning** — SLA metrics feed these widgets,
so design the queries with resolution-time in mind even if SLA ships later.

---

## Milestone 6 — SLA-lite: due dates & response/resolution times  ✅ done

The feature that separates JIRA Service Management from plain JIRA — and
SPARK is a service desk. Kept deliberately lightweight.

**Scope**
- `dueDate` (nullable) on Ticket, officer-set; overdue rows highlighted on
  the list and detail page.
- Computed metrics (no schema needed beyond what activity log holds):
  time-to-first-response (created → first officer comment/assignment) and
  time-to-resolution (created → Resolved status).
- Surface both on the dashboard (averages, overdue count) and per-ticket.

**Out of scope:** SLA policies per priority, business-hours calendars,
breach escalation. Only add if the client asks.

---

## Milestone 7 — Ticket relations & labels  ✅ done

- **Linked tickets:** self-relation table (`sourceId`, `targetId`, `linkType`
  enum: `DUPLICATES`, `RELATES_TO`, `BLOCKS`). Link UI on ticket detail;
  duplicates are the service-desk killer use case.
- **Labels:** free-form tags (`Label` + `TicketLabel` join), officer-managed,
  filterable on the list (extends Milestone 2's filter bar).
- **Saved filters:** persist a named set of list URL params per user.

Three small features bundled; ship in any order, cut freely under time
pressure.

---

## Milestone 8 — Kanban board view  🔴 highest priority

The most visually "JIRA" feature. High demo value, moderate effort, zero new
schema — statuses with `sortOrder` already map to columns.

**Scope**
- `/board` route (officer-focused): columns per status, cards with key/title/
  priority/assignee, drag-to-transition calling the existing status-change
  action (activity log + notifications come free).
- Filter by project/assignee reusing Milestone 2 params.
- ⚠️ Dev quirk: base-ui popups are dead in `next dev` — verify drag/drop
  interactions against a prod build before demoing (see project memory).
- Nice-to-have rider: markdown rendering in comments/description.

---

## Milestone 9 — Knowledge base  🟢  (the "K" in SPARK)

The acronym promises Knowledge; the app has none. Even a minimal KB makes
the product live up to its name and deflects repeat tickets.

**Scope**
- `Article` model: title, slug, body (markdown), category, author, published
  flag, timestamps. Officer-authored.
- Public (logged-in) article list + detail pages, searchable.
- "Before you file" suggestions on the new-ticket form: show top matching
  article titles as the user types.

---

## Deliberately not planned (revisit only on client request)

| Feature | Why skipped |
|---|---|
| Email notifications | In-app-only was a deliberate earlier decision |
| Bulk actions on tickets | Valuable only at higher ticket volume |
| Time tracking / worklogs / estimates | Rarely used well on IT desks |
| Sub-tasks, epics, sprints, story points | Agile-JIRA features; wrong product shape |
| Custom fields / workflow editor | JIRA's heaviest machinery; hard-coded workflow is right at this scale |
| CSV export / report builder | Cheap to add later off dashboard queries |
| Virus scanning, S3 storage | Overkill for an internal on-prem tool |

---

## Sequencing rationale

1–2 fix daily-use pain (can't attach, can't find). 3–4 round out the
collaboration loop. 5–6 are the client-visible analytics story and share
query work. 7–9 are polish/differentiators, each independently cuttable.
Every milestone leaves `main` shippable.

1–7 are done (shipped together rather than strictly sequentially — see
status note at top). 8 is next.
