---
name: ciit-start-app-idea
description: Turn a rough CIIT internal app idea into a clear buildable scope. Use when a vibe coder describes an app concept, department workflow, tracker, request system, dashboard, or internal tool and needs help shaping the MVP before coding.
---

# CIIT Start App Idea

Shape a rough internal app idea into a safe, buildable first version.

## Workflow

Ask only the missing questions needed to clarify the idea. If the user already gave enough context, proceed with reasonable assumptions.

Cover:

- Problem: what pain or workflow the app improves.
- Users: requester, processor, approver, admin, viewer.
- Data: what records the app stores or displays.
- Data classification: Public, Internal, or Sensitive.
- Screens: dashboard, list, form, detail, approval, admin.
- Core workflow: start state, actions, status changes, final state.
- MVP: what must exist in version 1.
- Out of scope: what should wait.
- Risks: privacy, auth, reporting, approval, or integration concerns.

## Output

Return a concise build brief:

```text
App name
Purpose
Primary users
Main workflow
Data classification
Data needed
Screens
MVP scope
Out of scope
First feature to build
Open questions
```

Keep wording non-technical. Do not create code unless the user explicitly asks to start implementation.
