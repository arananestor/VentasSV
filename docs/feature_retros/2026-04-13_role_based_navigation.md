# Feature Retro: Role-Based Navigation

- **Date:** 2026-04-13
- **PR:** #24
- **Architecture doc:** docs/architecture_design/role_based_navigation.md

## Changes

1. **roleConfig.js** — new utility with `ALL_TABS`, `PUESTO_TABS`, `getTabsForWorker(worker)`. Pure function, no React deps.
2. **App.js** — `MainTabs` now calls `getTabsForWorker(currentWorker)` and conditionally renders each `Tab.Screen` based on the result.
3. **roleConfig.test.js** — 17 AAA tests covering all roles, edge cases, order preservation, reference isolation.

## Tab visibility implemented

| Role/Puesto | Tabs |
|---|---|
| owner | Venta, Comandas, Ventas, Perfil |
| co-admin | Venta, Comandas, Ventas, Perfil |
| Cajero | Venta, Ventas, Perfil |
| Cocinero | Comandas, Perfil |
| Motorista | Perfil |
| Camarero | Perfil |

## What went well

- Architecture design doc defined the exact matrix — zero ambiguity
- The utility is pure JS with no React deps — trivially testable
- Owner/co-admin behavior is identical to before — no regression risk for existing users
- Grep verification confirmed no orphaned role checks conflict with the new system

## What went wrong

- Nothing — clean implementation following the design doc

## Lesson

- Centralized role config is better than scattered conditionals. All future role decisions should go through `roleConfig.js` instead of inline `worker.role === 'owner'` checks.
