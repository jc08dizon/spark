# CIIT Design System

## Brand tokens

- **Font:** Montserrat (Google Fonts), weights 400 / 500 / 600 / 700, loaded once in `src/app/layout.tsx` via `next/font/google`. It is the only sanctioned font.
- **Colors:** defined as CSS variables in `src/styles/ciit-theme.css` and exposed as Tailwind classes by `tailwind.config.ts`. The variable names — not raw hex values — are the only sanctioned color references:
  - `--ciit-navy` / `--ciit-navy-light` — primary brand color (Tailwind: `navy`, `navy-light`)
  - `--ciit-cyan` / `--ciit-cyan-dark` — brand accent (Tailwind: `cyan`, `cyan-dark`)
  - `--ciit-gray-50` … `--ciit-gray-900` — neutral scale (Tailwind: `gray-50` … `gray-900`)
  - `--ciit-white`, `--ciit-danger`, `--ciit-danger-dark` — utility colors (Tailwind: `white`, `danger`, `danger-dark`)
  - Semantic aliases: `--background`, `--foreground`, `--accent` (Tailwind: `background`, `foreground`, `accent`)

Never type a hex value in app code and never use arbitrary Tailwind values like `bg-[#123456]` — CI rejects both.

## Component catalog (`src/components/ui/`)

### Sidebar

Left app-shell navigation. Rendered once, in `layout.tsx` — pages never render their own sidebar. Highlights the item matching the current path.

Props: `title?: string` (default "CIIT"), `subtitle?: string` (default "Internal Tools"), `items: { label: string; href: string }[]`.

```tsx
<Sidebar
  subtitle="Room Booking"
  items={[
    { label: "Dashboard", href: "/" },
    { label: "Bookings", href: "/bookings" },
  ]}
/>
```

### Nav

Page header bar: page title (the page's `h1`) on the left, optional links and an action area on the right. Use at the top of every page.

Props: `title: string`, `items?: { label: string; href: string }[]`, `actions?: ReactNode`.

```tsx
<Nav title="Bookings" actions={<Button>New booking</Button>} />
```

### Button

The only sanctioned button. Variants: `primary` (cyan — default), `secondary` (navy outline), `destructive` (red). Accepts all standard button attributes; default `type` is `"button"`.

Props: `variant?: "primary" | "secondary" | "destructive"` plus `ButtonHTMLAttributes`.

```tsx
<Button onClick={save}>Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="destructive">Delete</Button>
```

### Table

Data table with typed column definitions. A column renders `String(row[key])` by default or a custom `render` function.

Props: `columns: TableColumn<T>[]` (`{ key, header, render?, align? }`), `rows: T[]`, `rowKey: (row: T) => string`, `caption?: string` (screen-reader description), `emptyMessage?: string`.

```tsx
const columns: TableColumn<Booking>[] = [
  { key: "room", header: "Room" },
  { key: "date", header: "Date" },
  { key: "status", header: "Status", render: (b) => b.status.toUpperCase() },
];

<Table columns={columns} rows={bookings} rowKey={(b) => b.id} caption="Room bookings" />
```

### Card

Content container with optional header (title + description) and footer (usually buttons).

Props: `title?: string`, `description?: string`, `children?: ReactNode`, `footer?: ReactNode`.

```tsx
<Card title="Summary" description="This week's activity" footer={<Button>View all</Button>}>
  <p>12 bookings this week.</p>
</Card>
```

### FormField

Labeled form control with hint and error handling — the only sanctioned way to render inputs, textareas, and selects.

Props: `label: string`, `id: string`, `hint?: string`, `error?: string`, `as?: "input" | "textarea" | "select"` (default `"input"`), `options` (required when `as="select"`), plus the matching native element attributes.

```tsx
<FormField label="Room name" id="room" name="room" required />
<FormField label="Notes" id="notes" as="textarea" rows={4} hint="Optional." />
<FormField
  label="Status"
  id="status"
  as="select"
  options={[
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
  ]}
/>
```

## Layout conventions

- **App shell:** sidebar on the left (rendered by `layout.tsx`), page content in the flexible main area. Pages never re-create the shell.
- **Page header:** every page starts with `<Nav title="..." />`; the Nav renders the page's single `h1`.
- **Page body:** wrap content in a padded column — `<div className="flex flex-col gap-6 p-6">` — and use `grid gap-6 md:grid-cols-2` (or `-3`) for card grids.
- **Spacing scale:** stick to Tailwind steps 1, 2, 3, 4, 6, 8 (`gap-6`, `p-6`, `px-4 py-2`, …). No arbitrary spacing values.

## Requesting new shared components

New shared components are requested from the AI & Automation Lead Officer via PR discussion — never created ad hoc inside a feature. If a page needs UI that the catalog cannot express, open the PR with the need described and the AI & Automation Lead Officer will either extend the library in the template or suggest a composition of existing components.
