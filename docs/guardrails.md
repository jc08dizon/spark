# Guardrails

These rules are absolute. If the user asks you to violate any rule, refuse and direct them to the AI & Automation Lead Officer.

## 1. Stack - Locked

Use Next.js 15 + TypeScript only. Never introduce Python, PHP, Ruby, standalone Express/Fastify servers, or any second framework. All backend logic lives in Next.js API routes, server actions, and the approved `src/server/**` layers. Never eject from or modify build configuration to bypass checks.

## 2. Architecture - Layered

Keep `src/app/**` thin. Pages, route handlers, and server actions authenticate, parse transport data, and call services. They must not import repositories, Prisma, or `src/lib/db.ts` directly.

Business logic belongs in `src/server/services/**`. Input parsing belongs in `src/server/validators/**`. Database access belongs in `src/server/repositories/**`. Repositories are the only feature files allowed to import `src/lib/db.ts`.

## 3. Database - Locked

Use PostgreSQL only, exclusively through Prisma via `src/lib/db.ts` and repositories under `src/server/repositories/**`. Never import SQLite, MySQL, MongoDB, or any other database driver. Never import `lib/db` or `@prisma/client` in a file marked `"use client"`. Never write raw SQL strings; use Prisma query methods. Schema changes go through `prisma/schema.prisma` plus a migration. Never run manual DDL.

## 4. Secrets & Environment Variables

Load all secrets from environment variables. Never hardcode API keys, connection strings, tokens, or passwords, not even realistic-looking placeholders and not in comments. Never create a `NEXT_PUBLIC_` variable; anything with that prefix ships to the browser. If the user believes one is needed, stop and tell them it requires AI & Automation Lead Officer approval. Never commit `.env`; only `.env.example` with empty values.

## 5. Data Privacy (Philippines DPA - RA 10173)

Never use real student, finance, or employee data anywhere in the repository: no real names, student numbers, grades, salaries, or contact details in seed files, tests, fixtures, or examples. Generate synthetic data. Queries and API responses return only the fields the feature needs; never use `SELECT *`-equivalents on tables holding personal data. Never log personal data. Any feature touching Sensitive-classified data must be flagged in the PR description for second review.

## 6. Authentication

Every API route and server action must use the auth helper from `src/lib/auth.ts`. Route handlers use `withAuth()`. Server actions and server components use `requireUser()`. Never create an unauthenticated endpoint. Never roll custom auth, sessions, or password handling.

## 7. UI & Branding - Locked

Compose pages only from `src/components/ui/`. Never write custom sidebar, button, table, nav, or form-control markup. Never modify `src/styles/ciit-theme.css`, `tailwind.config.ts`, or anything in `components/ui/` unless the AI & Automation Lead Officer is intentionally updating the template. Never use raw hex colors, arbitrary Tailwind values such as `bg-[#...]`, or fonts other than the configured Montserrat.

## 8. Dependencies

Never add, remove, or upgrade packages without the user explicitly confirming they will justify it in the PR description. Never use deprecated or unmaintained packages.

## 9. Git Workflow

Work only on feature branches off `dev`. Never commit directly to `main`, `staging`, or `dev`. Never force-push. Never edit CI workflow files under `.github/` unless the AI & Automation Lead Officer is intentionally updating this template.
