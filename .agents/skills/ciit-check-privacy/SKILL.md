---
name: ciit-check-privacy
description: Review a CIIT app idea, feature, form, table, workflow, seed data, fixture, or PR for privacy risk and data classification. Use when a vibe coder asks whether data is safe, sensitive, allowed, or ready for review.
---

# CIIT Check Privacy

Help vibe coders classify data and avoid privacy mistakes before implementation or PR review.

## Workflow

Check:

- Whether the feature touches student, finance, employee, academic, or personal data.
- The highest data classification: Public, Internal, or Sensitive.
- Whether each collected field is necessary.
- Whether examples, tests, screenshots, seeds, and fixtures are synthetic.
- Whether the feature reveals data to the right roles only.
- Whether logs, tables, exports, or notifications might expose personal data.
- Whether Sensitive-classified changes need a second reviewer.

## Classification Guide

- Public: no person-sensitive or business-sensitive information.
- Internal: operational CIIT information without personal, academic, financial, or employee-sensitive details.
- Sensitive: personal, academic, financial, student, or employee data.

## Output

Return:

```text
Classification
Why
Data fields reviewed
Fields to remove or minimize
Access-control notes
Synthetic-data notes
PR review notes
Open privacy questions
```

## Rules

- Never approve real student, finance, or employee data in the repository.
- Never suggest adding personal data "for realism."
- If uncertain, classify higher and tell the user to ask the AI & Automation Lead Officer.
