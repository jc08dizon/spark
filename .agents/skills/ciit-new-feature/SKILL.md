---
name: ciit-new-feature
description: Scaffold or implement a CIIT internal app feature using the approved layered architecture. Use when the user asks to add a feature, API route, server action, workflow, form, table, dashboard, or CRUD-like capability.
---

# CIIT New Feature

Add features using the approved architecture:

```text
src/app/** -> src/server/services/** -> validators/repositories -> src/lib/db.ts
```

## Before Editing

1. Read `AGENTS.md`, `docs/guardrails.md`, `docs/architecture.md`, and `docs/patterns/layered-feature.md`.
2. Identify the feature slug in kebab-case, such as `room-booking`.
3. Reuse existing UI components from `src/components/ui/`.
4. Do not add dependencies or modify locked files unless the user explicitly confirms AI & Automation Lead Officer approval.

## File Pattern

For server-backed features, prefer:

```text
src/app/api/<feature>/route.ts
src/server/services/<feature>Service.ts
src/server/validators/<feature>Validator.ts
src/server/repositories/<feature>Repository.ts
tests/<feature>-service.test.ts
```

For page UI, add:

```text
src/app/<feature>/page.tsx
```

Keep pages and route handlers thin. They authenticate, parse transport data, call services, and return UI/JSON.

## Implementation Rules

- Route handlers must use `withAuth()`.
- Server actions must start with `"use server"` and call `requireUser()`.
- Services own business rules and DTO mapping.
- Validators parse `unknown` input and throw `AppInputError` for user-fixable problems.
- Repositories are the only feature files that import `db`.
- Repositories must use Prisma query methods with explicit `select` fields.
- Use synthetic data in tests and examples.

## Validation

After implementation, run at least:

```bash
npm run typecheck
npm test
```

Run `$ciit-pre-pr-check` before a PR or when the change touches multiple layers.
