# Git & Review Workflow

## Branch Model

Three long-lived branches with one-way promotion:

```text
feature/<short-name> -> dev -> staging -> main (prod)
```

- `main`: production. Only receives merges from `staging`.
- `staging`: pre-production verification with synthetic data. Only receives merges from `dev`.
- `dev`: integration branch. Receives feature branches.
- Feature branches: `feature/<short-name>`, branched off `dev`. All day-to-day work happens here. Never commit directly to `main`, `staging`, or `dev`, and never force-push.
- Hotfixes: `hotfix/<short-name>` branched off `main`, merged back to `main` via PR, then mandatorily back-merged to `staging` and `dev` so the fix is never lost on the next promotion.

Promotion is one-way only: `dev` -> `staging` -> `main`. Never merge `main` or `staging` backward into `dev`; hotfix back-merges are the single exception.

## Pull Request Rules

- All merges happen via PR. No direct pushes to long-lived branches.
- The AI & Automation Lead Officer is the required reviewer, enforced by `.github/CODEOWNERS`. Set the real GitHub username in that file before the repo's first PR.
- The quality gate must pass. Seven deterministic CI checks run on every PR targeting `dev`, `staging`, or `main`: stack check, architecture boundary check, secrets scan, database boundary check, theme check, dependency audit, and build + typecheck + tests.
- Before opening a PR, ask Codex to use `$ciit-pre-pr-check` so failures are caught locally first.
- The PR template must be completed, including the data-classification field and the "no real student, finance, or employee data" confirmation.
- Sensitive-classified changes require a second reviewer in addition to the AI & Automation Lead Officer.
- An AI review workflow may be added later as a separate workflow. It complements, but never replaces, the AI & Automation Lead Officer's human approval.

## Branch Protection

Branch protection rules are configured in GitHub repository settings after the repo is created from the template. They are not stored in-repo. The AI & Automation Lead Officer sets these up as part of provisioning a new app repo.
