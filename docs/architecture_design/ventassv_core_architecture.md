# VentasSV — Core Architecture

## Document Status

- Status: Implemented
- Owner: Néstor Arana
- Repository: `VentasSV`
- GitHub milestone: Beta v0.1
- Related PRs: #2 (testing infrastructure)

---

## Summary

VentasSV is a mobile POS (Point of Sale) application built with React Native and Expo, designed for small and medium businesses in El Salvador.

This document describes the foundational architectural decisions made during the initial build: the data layer, authentication model, navigation structure, role system, and the integration contract with Qentas — the accounting platform that will serve as the backend source of truth.

---

## Product Intent

VentasSV gives business owners and their teams a fast, intuitive tool to:

- take and manage orders
- process payments (cash and transfer)
- track daily sales with geolocation
- manage staff by role and shift
- send tickets via WhatsApp
- print receipts
- manage product catalog with ingredients and extras

VentasSV is not a standalone accounting system. It is the operational surface of a business. Qentas handles the legal and accounting layer. VentasSV feeds it.

---

## Core Design Principles

**AppContext is the single source of truth.** All data flows through one context. When Qentas connects, two lines change — the URL and the anon key. Nothing else.

**No direct main branch pushes.** All changes go through feature branches and PRs into develop. Main only receives stable, tested merges from develop.

**Tests before merge.** No PR merges without passing the full test suite.

**Spanish-first UI.** Everything the user sees is in Spanish. Internal code identifiers are in English.

---

## Decision Filter

Before adding any feature, ask:

Does this help a business owner in El Salvador run their business better today?

If not, defer it.

---

## Goals

- Ship a working beta that real businesses can use.
- Keep AppContext as the single data integration point for Qentas.
- Role-based access that reflects real business structures.
- Device-aware behavior (fixed vs personal).
- Schema versioning so data migrations never break existing users.
- 100% test coverage on business logic before beta.

## Non-Goals

- Qentas API integration in v1 (placeholder hooks exist, implementation deferred).
- E2E tests in v1 (deferred until post-beta, Detox setup pending).
- Multi-device sync in v1.
- Landscape mode in v1.
- DTE emission in v1 (architecture is ready, Qentas API is not).

---

## Architecture Layout

### Data Layer — `AppContext`

Single context provider wrapping the entire app. Manages:

- product catalog
- sales history
- cart state
- global snackbar
- Qentas integration hooks (placeholder)

**Qentas integration point:** `addSale`, `addProduct`, `updateSaleStatus` will become API calls. The swap is isolated to `AppContext` — no screen touches the network directly.

### Auth Layer — `AuthContext`

Manages:

- owner/co-admin/worker role hierarchy
- 4-digit PIN authentication per worker
- device type (fixed vs personal)
- schema versioning and migration
- shift management

**Role hierarchy:**
```
owner → co-admin → worker (cajero, cocinero, motorista, camarero)
```

Owner is created once via Setup. When Qentas connects, Setup is replaced by OAuth login — the owner profile comes from the Qentas account.

### Navigation — `App.js`

```
isSetup === false  →  SetupScreen (first launch only)
isSetup === true, no currentWorker  →  SelectWorker → PinEntry
isSetup === true, currentWorker  →  MainTabs
```

MainTabs: Venta | Comandas | Ventas | Perfil

HomeStack inside Venta: HomeMain → OrderBuilder → Payment → AddProduct → ManageTabs

### Theme Layer — `ThemeContext`

Dark/Light mode. Dark is default. All colors reference theme tokens — no hardcoded colors in screens.

### Tab Layer — `TabContext`

Product organization by tabs (e.g. Pupusas, Bebidas, Eventos). Each tab has a filter type (all, fixed, event) and a list of product IDs.

---

## Authentication Model

PINs are exactly 4 digits, generated automatically. The owner's PIN is the master key.

Workers authenticate per session. On fixed devices, closing a session returns to SelectWorker. On personal devices, closing a session logs out completely.

The owner can view any worker's PIN but cannot impersonate them. Each sale records the worker who processed it.

---

## Schema Versioning

`ventasv_schema_version` is stored in AsyncStorage alongside worker data.

Current version: `2`

Migration v1→v2: admin role becomes owner, workers without a `puesto` field default to Cajero.

Every future breaking change to the data model increments this version and adds a migration function. No user ever loses data.

---

## Qentas Integration Contract

When the Qentas API is ready, the integration points are:

| VentasSV action | Qentas call |
|---|---|
| `addSale` | `POST /ventas` → triggers DTE emission |
| `addProduct` | `POST /productos` → syncs inventory |
| `deleteProduct` | `DELETE /productos/:id` |
| Login | OAuth with Qentas credentials |
| Owner profile | Pulled from Qentas account on login |

The swap requires changing the base URL and auth token in `AppContext`. No screen changes.

**DTE flow when connected:**
```
VentasSV sale → Qentas API → Ministerio de Hacienda → sealed DTE → returned to cajero → sent to client via WhatsApp or print
```

---

## Testing Strategy

Unit tests cover all business logic in `src/context/` and `src/utils/`.
Integration tests cover multi-step flows: payment processing, order status transitions, cart operations.
Component snapshot tests are next (blocked pending React 19 / testing-library compatibility).
E2E tests (Detox) are deferred to post-beta.

Current coverage: 119 tests, 10 suites, 100% passing.

---

## Phasing

### Phase 0 — Foundation (current)
- Core POS flow working
- Auth with roles and PINs
- Product catalog with SVG icons
- Cart and payment processing
- Sales history with geolocation
- WhatsApp tickets
- Comandas screen
- Testing infrastructure

### Phase 1 — Role Interfaces
- Onboarding flow (solo vs team)
- Dashboard for owner
- Dedicated UI per role (cajero, cocinero, motorista, camarero)
- Shift start/end flow per device type

### Phase 2 — Qentas Connection
- OAuth login with Qentas
- DTE emission on sale
- Inventory sync
- Owner profile from Qentas account

### Phase 3 — Scale
- Multi-device sync
- E2E tests
- OTA updates via EAS
- Lazy loading per role module

---

## Completion Criteria for This Document

This document is complete when:

- the core data flow is agreed and implemented
- the Qentas integration boundary is defined
- the role and auth model is stable
- the testing strategy is documented
