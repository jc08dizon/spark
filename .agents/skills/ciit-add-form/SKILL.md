---
name: ciit-add-form
description: Design a safe CIIT internal app form before implementation. Use when a vibe coder asks for a request form, submission form, approval form, edit form, survey-like input, or validation rules.
---

# CIIT Add Form

Design forms in plain language first, then map them to the approved framework if implementation is requested.

## Workflow

Clarify:

- Form purpose.
- Who fills it out.
- Who can view submitted records.
- Data classification.
- Fields, field types, required/optional status, and validation.
- Confirmation or next step after submit.
- Whether the form starts an approval workflow.
- What should not be collected.

## Output

Return:

```text
Form name
Purpose
Who submits it
Data classification
Fields
Validation rules
Submission flow
Success message
Privacy notes
Implementation notes
```

## Implementation Mapping

If the user asks to build the form:

- Use `src/components/ui/FormField.tsx` and other locked UI components.
- Put input parsing in `src/server/validators/**`.
- Put business flow in `src/server/services/**`.
- Put database writes in `src/server/repositories/**`.
- Use synthetic examples only.

Do not add new UI libraries, custom form controls, or `NEXT_PUBLIC_` variables.
