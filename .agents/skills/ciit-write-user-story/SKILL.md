---
name: ciit-write-user-story
description: Convert a CIIT app or feature idea into plain-language user stories, acceptance criteria, edge cases, and test ideas. Use before coding when a vibe coder has a vague request, app workflow, form, table, approval process, or dashboard idea.
---

# CIIT Write User Story

Turn a feature idea into a clear build target before implementation.

## Workflow

Start from the user's idea. Ask only for missing details that materially affect scope, privacy, or acceptance criteria.

Cover:

- Actor: who uses the feature.
- Goal: what they need to accomplish.
- Benefit: why it matters.
- Data classification: Public, Internal, or Sensitive.
- Preconditions: what must already be true.
- Main path: normal successful flow.
- Edge cases: empty states, invalid input, missing permissions, duplicate requests.
- Acceptance criteria: observable pass/fail conditions.

## Output

Return:

```text
Feature summary
User story
Acceptance criteria
Data needed
Privacy notes
Screens affected
Edge cases
Test ideas
Open questions
```

Keep the story testable and small enough for one PR when possible. Do not code unless the user asks to implement.
