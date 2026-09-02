---
name: ciit-guardrail-review
description: Review CIIT template changes against architecture, security, privacy, UI, dependency, and PR guardrails. Use when the user asks to review guardrails, check compliance, inspect a change, or verify that work follows the framework.
---

# CIIT Guardrail Review

Review the current change against the CIIT framework guardrails without modifying files unless the user asks for fixes.

## Review Sources

Read as needed:

- `AGENTS.md`
- `docs/guardrails.md`
- `docs/architecture.md`
- `docs/design-system.md`
- `docs/workflow.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

## Checks

Inspect the working tree and changed files for:

- Unsupported frameworks, languages, or server libraries.
- API routes missing `withAuth()`.
- Server actions missing `"use server"` or `requireUser()`.
- `src/app/**` importing repositories, Prisma, or `src/lib/db.ts`.
- Services importing Prisma or `src/lib/db.ts` directly.
- Validators importing services, repositories, Prisma, or `src/lib/db.ts`.
- Database access outside `src/server/repositories/**`.
- Raw SQL or broad data selection where field-level `select` should be used.
- Real-looking student, finance, employee, email, phone, or ID data in tests, seeds, examples, or docs.
- Custom UI controls where `src/components/ui/` should be used.
- Raw hex colors, arbitrary Tailwind values, or font declarations outside the theme.
- New or changed dependencies without PR justification.
- Locked files changed without AI & Automation Lead Officer approval.

## Commands

Run these when available:

```bash
bash .github/scripts/check-stack.sh
bash .github/scripts/check-architecture-boundary.sh
bash .github/scripts/check-public-env.sh
bash .github/scripts/check-db-boundary.sh
bash .github/scripts/check-theme.sh
npm run typecheck
npm test
```

On Windows, use Git Bash for shell scripts. Use `npm.cmd` if PowerShell blocks `npm.ps1`.

## Output

Lead with findings, ordered by severity. Include file paths and line numbers when possible.

If no issues are found, say so clearly and list which checks were run. Note any checks that could not be run and why.
