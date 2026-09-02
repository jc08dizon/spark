# Architecture

This template uses a layered Next.js architecture, not classic MVC. Next.js owns routing and rendering; the application code is organized so pages and route handlers stay thin, business rules live in services, and database access stays behind repositories.

## Layer Model

```text
View / Transport Layer
  src/app/** pages, layouts, route handlers, server actions
    -> Application Layer
       src/server/services/**
         -> Validation Layer
            src/server/validators/**
         -> Data Layer
            src/server/repositories/**
              -> Database Boundary
                 src/lib/db.ts + Prisma
```

Rules:

- `src/app/**` may import UI components, auth helpers, server services, and server errors.
- `src/app/**` must not import repositories, Prisma, or `src/lib/db.ts`.
- `src/server/services/**` contains workflows, permissions, and business rules. Services call validators and repositories.
- `src/server/services/**` must not import Prisma or `src/lib/db.ts` directly.
- `src/server/validators/**` contains input parsing and validation. Validators must not call the database.
- `src/server/repositories/**` is the only place feature code can import `src/lib/db.ts`.
- `src/lib/db.ts` is the only place that imports `@prisma/client`.

## Folder Conventions

```text
src/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout: fonts, theme CSS, app shell
│   ├── page.tsx                 # Dashboard landing page
│   ├── <feature>/page.tsx       # Feature pages, kept thin
│   ├── <feature>/actions.ts     # Server actions, always "use server"
│   └── api/<name>/route.ts      # Route handlers, always wrapped in withAuth()
├── components/ui/               # LOCKED shared UI library
├── lib/
│   ├── auth.ts                  # LOCKED auth helper
│   ├── db.ts                    # LOCKED Prisma client singleton
│   └── env.ts                   # Fail-fast environment validation
├── server/
│   ├── errors.ts                # Shared server-side application errors
│   ├── services/                # Application/business layer
│   ├── validators/              # Input validation layer
│   └── repositories/            # Data access layer
├── middleware.ts                # Default-deny auth gate
├── instrumentation.ts           # Startup environment validation
├── styles/                      # LOCKED theme + global CSS
└── types/                       # Shared TypeScript types, create when needed
```

Pages and layouts are server components by default. Add `"use client"` only for interactivity, and never import server-only modules from a client file.

## Approved Request Flow

Route handlers and server actions should look like this:

```text
withAuth() or requireUser()
  -> parse request data
  -> call a service
  -> service validates input
  -> service calls repository
  -> repository uses Prisma through db
  -> return a small DTO
```

`src/app/api/example-items/route.ts` is the canonical API example. It authenticates through `withAuth()`, calls `exampleItemService`, and returns JSON. It does not query Prisma directly.

`src/server/services/exampleItemService.ts` is the canonical service example. It validates raw input, calls a repository port, and returns DTOs with transport-safe values.

`src/server/repositories/exampleItemRepository.ts` is the canonical repository example. It imports `db`, uses Prisma query methods, selects only needed fields, and returns persistence records to the service.

## Database Access Pattern

- `src/lib/db.ts` exports the single Prisma client.
- Feature database access lives in `src/server/repositories/**`.
- Repositories select only fields the feature needs.
- Raw SQL remains discouraged and is flagged for manual review.
- Schema changes go through `prisma/schema.prisma` and a migration. Never run manual DDL.

Example repository shape:

```ts
import { db } from "@/lib/db";

export async function listRecords() {
  return db.exampleItem.findMany({
    select: { id: true, title: true, createdAt: true },
  });
}
```

## Auth Pattern

`src/lib/auth.ts` exposes:

- `requireUser()`: for server components and server actions. Call it first.
- `withAuth(handler)`: for route handlers. It returns 401 before your handler runs when the session is missing or invalid.
- `verifySession()` and `createSessionToken()`: signed-cookie internals. `verifySession()` is the integration point for CIIT SSO before production.

Server action pattern:

```ts
"use server";

import { requireUser } from "@/lib/auth";
import { exampleItemService } from "@/server/services/exampleItemService";

export async function createItem(formData: FormData) {
  await requireUser();
  return exampleItemService.createExampleItem({
    title: formData.get("title"),
  });
}
```

## Defense In Depth

`src/middleware.ts` is a default-deny auth gate. Anything not on the public allowlist is rejected without a valid session cookie. This is a safety net, not a substitute: every route handler and server action still must use `withAuth()` or `requireUser()`.

Widening the public allowlist requires AI & Automation Lead Officer approval.

## Configuration

`src/lib/env.ts` exports `assertEnv()`, which validates required environment variables and reports all problems in one error. `src/instrumentation.ts` runs it at server startup.

When a feature needs a new environment variable:

- Add it to `assertEnv()`.
- Add the key to `.env.example` with an empty value.
- Never create `NEXT_PUBLIC_` variables without AI & Automation Lead Officer approval.

## Environment Tiers

| Tier | Where | Data |
|---|---|---|
| Dev | Local Docker Compose | Synthetic only |
| Staging | Shared staging environment | Synthetic only |
| Prod | Production hosting | Real data lives only here |

Never copy production data down to staging or dev. Generate synthetic data instead.
