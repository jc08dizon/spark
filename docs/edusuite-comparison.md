# Template Comparison: CIIT Codex Template vs Edusuite Starter

_Reviewed 2026-07-06 against the older `edusuite-claude-starter` Bitbucket export `bc6350a5196d`. Updated for the Codex-only CIIT template. This is a decision record for what CIIT adopted, what remains a candidate, and where the templates deliberately differ._

## Shared Philosophy

Both templates solve the same basic problem: a non-developer builds a light internal app while guardrails keep the work safe. They share several patterns: authenticate everything, never commit secrets, protect critical files, provide a sample feature to copy, and rely on CI as the enforcement backstop.

The CIIT version is now Codex-native. Its assistant layer lives in `AGENTS.md`, `.codex/config.toml`, and repo skills under `.agents/skills/`.

## Where The Templates Diverge

| Dimension | CIIT Codex template | Edusuite starter |
|---|---|---|
| Assistant layer | Codex instructions, project config, and repo skills | Older external-agent instruction and command files |
| Database | PostgreSQL + Prisma via locked `db.ts` | DynamoDB single-table, `PK = USER#<sub>` |
| Auth | Signed-cookie placeholder; `verifySession()` is the SSO integration point | NextAuth v5 + Cognito OIDC, offline dev login, `requireAdmin()` roles |
| Deployment | Out of template scope; IT provisions hosting | Baked in: CloudFormation to ECS Express/Fargate |
| UI governance | Locked component catalog + theme CI check + hash lock | DESIGN.md reference doc, unenforced |
| Data privacy | RA 10173 rules, synthetic-data tiers, PR data classification | Basic PII guidance |
| Git/review | `dev` -> `staging` -> `main`, PR-only, AI & Automation Lead Officer as CODEOWNER | Single `main`, manual deploy gate |
| Protected files | Enforced by CI hash locks and boundary checks | Mostly convention-based |
| CI | Seven deterministic checks: stack, architecture boundary, secrets, db boundary, theme, deps, build | Lint, typecheck, isolation tests, gitleaks, Docker build, cfn-lint |

Notable trade-off: Edusuite makes per-user isolation structural through its DynamoDB partition key and isolation tests. CIIT keeps PostgreSQL because it is friendlier to relational internal tools, but it should still adopt isolation tests as a required pattern for user-scoped features.

## Adopted Into The CIIT Template

1. **Fail-fast environment validation**: `src/lib/env.ts` runs at boot through `src/instrumentation.ts`. Misconfigured deployments fail at startup with the full problem list. This is implemented without adding a validation dependency.
2. **Default-deny middleware**: `src/middleware.ts` requires a valid session for everything outside a small public allowlist. `withAuth()` and `requireUser()` remain mandatory; middleware is defense in depth.
3. **Codex-native pre-PR check**: `.agents/skills/ciit-pre-pr-check/SKILL.md` mirrors the CI quality gate so builders can catch failures before opening a PR.

## Candidates For AI & Automation Lead Officer To Decide

- Zod validation at every server boundary. This requires a dependency decision under guardrail 7.
- Per-user isolation tests as a required test class, run against Docker Postgres in CI.
- Additional onboarding skills, such as first-run readiness checks for Git, Node, Docker, and Codex.
- Pre-commit gitleaks hook through `.githooks/` and an npm `prepare` script.
- Renovate for dependency update PRs, with a clear guardrail 7 policy.

## Gaps In Edusuite That CIIT Already Covers

The CIIT template has a locked UI kit, layered architecture checks, data-classification workflow, privacy workflow, theme checks, stack checks, database-boundary checks, and required human review.

## Porting Caution

Do not transplant Edusuite's stack directly. Its auth, deployment, and database choices are different. Port patterns such as environment validation, middleware shape, isolation tests, and onboarding workflows only when they fit the CIIT guardrails.
