# Feature Retro: Critical HomeScreen Fixes

- **Date:** 2026-04-09
- **PR:** #13

## Changes

1. **requestAdminAction bug** — was checking `role === 'admin'` which doesn't exist, so the owner always got the PIN prompt for their own actions. Fixed to check `owner` and `co-admin`.
2. **Sales button removed** — navigated to 'Sales' which doesn't exist in HomeStack (it's in SalesStack via bottom tabs). Removed the broken shortcut entirely.
3. **"Co-Administrador" → "Encargado"** — renamed the visible label in PUESTOS, PUESTO_ICONS, and the role assignment logic. Internal role `co-admin` unchanged.

## What went well

- All three fixes are isolated, low-risk changes
- Tests caught the rename immediately — auth.test.js and workers.test.js both referenced "Co-Administrador"
- The requestAdminAction bug was a clear logic error that would have blocked every owner from editing products or managing tabs

## What went wrong

- The `role === 'admin'` bug has been in the codebase since the initial HomeScreen implementation and was never caught because there were no tests for requestAdminAction logic
- The Sales button was likely a leftover from before the bottom tab navigation was set up

## Lesson

- Always test admin action flows end-to-end: can the owner edit? Can a worker trigger the PIN prompt? Can a co-admin bypass?
- When removing navigation routes, grep for all `navigate('RouteName')` calls to find orphaned references
