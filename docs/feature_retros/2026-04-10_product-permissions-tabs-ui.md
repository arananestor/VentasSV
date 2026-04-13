# Feature Retro: Product Permissions & Tabs UI

- **Date:** 2026-04-10
- **PR:** #16

## Changes

1. **AddProductScreen role bug** — was checking `role !== 'admin'` (nonexistent role), blocking everyone from saving products. Fixed to allow owner and co-admin. Error message changed to "Solo el dueño o encargado puede agregar productos".
2. **PIN modal text** — "PIN de administrador" → "PIN de autorización" (consistent with role rename).
3. **Tabs UI** — removed standalone settings button from header. Added "Pestañas" button (folder-plus icon, dashed border) integrated at the end of the tab pills scroll. Shows a hint "Creá pestañas para organizar tus productos por categoría" when only 1 tab exists.
4. **Global role audit** — grepped entire codebase for `role === 'admin'`. Only remaining instance is in migration test (correct — handles v1→v2 legacy data).

## What went well

- The `role === 'admin'` bug in AddProductScreen was a blocker for the entire product creation flow — critical fix
- Tabs UI integrates naturally with the existing pill scroll — "Pestañas" button at the end feels cohesive
- Hint for single-tab users provides gentle discoverability without being intrusive

## What went wrong

- The AddProductScreen role bug was the same pattern as the HomeScreen bug fixed in PR #13 — should have been caught in the same audit

## Lesson

- When fixing a role check bug, always grep the entire codebase for the same pattern in all files, not just the file you're working on
- A single `grep -r "role === 'admin'" src/` would have caught both bugs at once
