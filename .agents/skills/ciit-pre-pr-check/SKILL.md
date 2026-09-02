---
name: ciit-pre-pr-check
description: Run the CIIT Codex template quality-gate checks before opening a pull request.
---

# CIIT Pre-PR Check

Run the same seven checks the CI quality gate will run on the pull request. Run every check even if an earlier one fails so the builder gets the full picture. Use bash for the repository shell scripts.

1. Stack check: `bash .github/scripts/check-stack.sh`
2. Architecture boundary check: `bash .github/scripts/check-architecture-boundary.sh`
3. Public environment check: `bash .github/scripts/check-public-env.sh`
   - CI also runs a gitleaks secret scan on the diff. Remind the builder of this, but do not install gitleaks.
4. Database boundary check: `bash .github/scripts/check-db-boundary.sh`
5. Theme check: `bash .github/scripts/check-theme.sh`
6. Dependency audit: `npm audit --audit-level=high`
   - Also check whether `package.json` changed relative to `dev`. If it did, verify `package-lock.json` changed too.
7. Build, typecheck, and tests:
   - `npx tsc --noEmit`
   - `npm run build`
   - `npm test`

When all checks have run, output a summary table with check name, PASS/FAIL, and a one-line cause plus concrete fix for each failure.

If a failure involves a locked file (`.github/**`, `src/components/ui/**`, `src/styles/ciit-theme.css`, or `tailwind.config.ts`), do not modify the locked file. Tell the builder to revert their change or contact the AI & Automation Lead Officer.

Finish by reminding the builder to complete the PR template, including the data-classification field and the "no real data" confirmation.
