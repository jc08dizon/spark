---
name: ciit-explain-change
description: Explain CIIT repository changes in simple non-technical language. Use when a vibe coder asks what changed, how to test it, what files matter, what to write in a PR, or how to explain an update to reviewers.
---

# CIIT Explain Change

Translate code changes into a clear builder-friendly explanation.

## Workflow

Inspect the relevant files or diff. If no diff is available, ask what change should be explained.

Explain:

- What changed.
- Why it changed.
- What the user can now do.
- What files or screens are affected.
- How to test it locally.
- Any privacy, data, or review notes.
- What to write in the PR.

## Output

Return:

```text
Plain-English summary
What changed
Why it matters
How to test
Files touched
PR description draft
Reviewer notes
```

## Style

- Use plain language.
- Avoid unnecessary implementation detail.
- Mention technical file paths only when helpful.
- Do not hide failed checks or unresolved risks.
