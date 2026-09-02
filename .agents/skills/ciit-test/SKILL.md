---
name: ciit-test
description: Run the standard CIIT template local verification checks. Use when the user asks to test, verify, typecheck, run checks, or quickly validate repository changes without the full pre-PR gate.
---

# CIIT Test

Run the standard local verification checks for developer feedback.

## Workflow

Run these commands in order:

```bash
npm run typecheck
npm test
```

On Windows PowerShell, use `npm.cmd run typecheck` and `npm.cmd test` if the `npm.ps1` shim is blocked by execution policy.

## Optional Build Check

Run `npm run build` only when:

- The user asks for a production build.
- A change touches Next.js routing, layout, fonts, middleware, API routes, or build configuration.
- You need stronger confidence before a PR.

If the build fails while fetching Google Fonts because network access is blocked, report that clearly and request approval before retrying with network access.

## Output

- PASS/FAIL for typecheck
- PASS/FAIL for tests
- PASS/FAIL for build when run
- The first useful error and the likely fix for each failure

Do not modify files unless the user explicitly asks for fixes.
