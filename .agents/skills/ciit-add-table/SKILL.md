---
name: ciit-add-table
description: Design a privacy-safe CIIT internal app table or list view before implementation. Use when a vibe coder asks to show records, dashboards, pending items, request lists, filters, sorting, columns, or empty states.
---

# CIIT Add Table

Design table and list views that show only useful, privacy-safe fields.

## Workflow

Clarify:

- What records the table lists.
- Who can see the table.
- Data classification.
- Columns needed for decisions.
- Columns to avoid because they expose unnecessary personal data.
- Filters, sort order, status chips, and search needs.
- Empty state and loading state.
- Row actions, such as view, approve, reject, or edit.

## Output

Return:

```text
Table name
Purpose
Audience
Data classification
Columns
Filters and sorting
Row actions
Empty state
Privacy notes
Implementation notes
```

## Implementation Mapping

If the user asks to build the table:

- Use `src/components/ui/Table.tsx`.
- Select only the fields needed for the columns.
- Put data loading in services and repositories, not directly in UI.
- Use synthetic demo rows in examples.

Do not add custom table components or expose fields just because they exist in the database.
