# Architecture Design: Role-Based Navigation

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-12
- Target branch: feat/role-based-navigation

---

## Problem

Currently App.js renders all 4 tabs (Venta, Comandas, Ventas, Perfil) to every logged-in user regardless of their role or puesto. A Cajero sees Comandas (kitchen orders), a Cocinero sees the POS system — neither should. The app needs to show different tabs based on who is logged in.

The business context: VentasSV will eventually support role-specific views for each position (Cajero, Cocinero, Motorista, Camarero) plus a full-access Owner/Co-admin dashboard. This PR establishes the tab-filtering infrastructure and implements the first restricted role: Cajero.

---

## Solution

Create a centralized role configuration utility (`src/utils/roleConfig.js`) that maps each role/puesto to its allowed tabs. Modify `MainTabs` in `App.js` to read this config and render only the tabs the current worker should see. This is an additive change — owner/co-admin behavior remains identical to today.

### Tab visibility per role:

| Role/Puesto   | Venta | Comandas | Ventas | Perfil |
|---------------|-------|----------|--------|--------|
| owner         | ✅    | ✅       | ✅     | ✅     |
| co-admin      | ✅    | ✅       | ✅     | ✅     |
| Cajero        | ✅    | ❌       | ✅     | ✅     |
| Cocinero      | ❌    | ✅       | ❌     | ✅     |
| Motorista     | ❌    | ❌       | ❌     | ✅     |
| Camarero      | ❌    | ❌       | ❌     | ✅     |

Notes:
- Motorista and Camarero only get Perfil for now (their dedicated screens come in future PRs)
- Cocinero gets Comandas + Perfil (OrdersScreen is already built for them)
- Cajero gets Venta + Ventas + Perfil (SalesScreen already shows today-only via getTodaySales)
- owner and co-admin see everything (preserves current behavior exactly)

### Resolution logic:

The function `getTabsForWorker(worker)` determines tabs by checking:
1. If `worker.role === 'owner'` or `worker.role === 'co-admin'` → all tabs
2. Otherwise, match by `worker.puesto` → specific tab set
3. Fallback (unknown puesto) → Perfil only (safe default)

---

## Changes

### 1. New file: `src/utils/roleConfig.js`

Exports:
- `ALL_TABS` — ordered array of tab name strings: `['Venta', 'Comandas', 'Ventas', 'Perfil']`
- `PUESTO_TABS` — object mapping each puesto to its allowed tab names
- `getTabsForWorker(worker)` — returns array of allowed tab names for a given worker object. Pure function, no React deps.

### 2. Modified: `App.js`

In `MainTabs`:
- Import `getTabsForWorker` from `src/utils/roleConfig`
- Call `const allowedTabs = getTabsForWorker(currentWorker)` at the top of the component
- Wrap each `Tab.Screen` in a conditional: only render if `allowedTabs.includes('TabName')`
- All tab definitions stay in the file; filtering wraps each in a check
- No changes to HomeStack, SalesStack, ProfileStack, or AppNavigator

### 3. New tests: `__tests__/unit/roleConfig.test.js`

All tests MUST follow AAA pattern (Arrange-Act-Assert with comments). Test cases:
- Owner gets all 4 tabs
- Co-admin gets all 4 tabs
- Cajero gets Venta, Ventas, Perfil (NOT Comandas)
- Cocinero gets Comandas, Perfil (NOT Venta, NOT Ventas)
- Motorista gets Perfil only
- Camarero gets Perfil only
- Null/undefined worker falls back to Perfil only
- Worker with unknown puesto falls back to Perfil only
- Every returned tab is a member of ALL_TABS (no typos)
- Perfil is always present for every role (invariant)
- Tab order matches ALL_TABS order regardless of puesto
- getTabsForWorker returns a new array each call (no shared references)

---

## Rules

- Do NOT change any screen logic (POSScreen, SalesScreen, etc.) — this PR only filters which tabs render
- Do NOT create new screens or modify existing screen components
- Owner and co-admin must see EXACTLY the same tabs they see today (all 4)
- Perfil tab ALWAYS renders for every role — it's the escape hatch (logout/switch shift)
- Tab order must remain: Venta → Comandas → Ventas → Perfil (tabs that aren't shown are simply omitted)
- roleConfig.js must be pure JS with no React dependencies (enables easy unit testing)
- All tests must follow AAA pattern with // Arrange, // Act, // Assert comments
- Before committing, run `grep -rn "role ===" src/` and `grep -rn "puesto ===" src/` to verify no orphaned checks conflict with the new system. Include output in PR description.

---

## Verification

1. `npm test` — 0 failures, new roleConfig tests pass, total 440+ tests
2. Manual: log in as owner → see all 4 tabs (Venta, Comandas, Ventas, Perfil)
3. Manual: create a Cajero worker, log in → see only Venta, Ventas, Perfil
4. Manual: create a Cocinero worker, log in → see only Comandas, Perfil
5. Verify tab order is preserved (no jumps or reordering)
6. Verify Perfil tab always shows the worker's name/photo regardless of role
