# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

VentasSV is a mobile-first POS (Point of Sale) app for El Salvador built with React Native + Expo SDK 54. Plain JavaScript (no TypeScript). Spanish UI text, English code identifiers. Portrait-only. Currently in Phase 0 (offline-first, single device).

## Stack — Do Not Modify Without Full Impact Verification

React Native 0.81.5, Expo ~54.0.33, React 19.1.0, AsyncStorage, React Navigation, @expo/vector-icons (Feather + MaterialCommunityIcons), react-native-safe-area-context, react-native-svg, expo-image-picker, expo-print, expo-sharing, expo-location, expo-constants, jest-expo, @types/jest.

**CRITICAL:** Do NOT update React or any native dependency without verifying full compatibility with react-native-renderer (pinned to 19.1.0), Expo SDK, and all related packages. A single version bump can break the entire app.

**BLOCKED:** @testing-library/react-native is NOT installed — incompatible with React 19.1.0. Component UI tests use pure JS logic only, no component rendering.

## Commands

```bash
# Development
npm start              # Start Expo dev server
make dev-clear         # Start with cache cleared
make tunnel            # Expo with tunnel (restrictive networks)

# Testing
npm test               # Run all tests (760 tests, 52 suites — must be 0 failures)
npm run test:unit      # Unit tests only (__tests__/unit/)
npm run test:integration  # Integration tests only (__tests__/integration/)
npm run test:coverage  # Coverage report (70% threshold)
npm run test:watch     # Jest watch mode

# Building
make build-preview     # APK preview build via EAS
make build-prod        # Production Android build
make update m='msg'    # OTA update to production
```

## Architecture

**Provider chain:** App.js → SafeAreaProvider → ThemeProvider → AuthProvider → AppProvider → TabProvider → NavigationContainer → AppNavigator

**State management:** React Context API (no Redux). Four contexts:

- `src/context/AppContext.js` — Single source of truth: products, sales, cart, order numbers, snackbar, Qentas hooks (placeholder)
- `src/context/AuthContext.js` — Role hierarchy, 4-digit PIN auth, worker management, schema versioning v2, migration v1→v2
- `src/context/TabContext.js` — Product tab/category organization
- `src/context/ThemeContext.js` — Light/dark mode tokens

**Navigation:**
- No worker: Setup → SelectWorker → PinEntry
- With worker: MainTabs (Venta | Comandas | Ventas | Perfil)
- HomeStack: HomeMain → OrderBuilder → Payment → AddProduct → ManageTabs
- SalesStack: SalesMain → SaleDetail
- ProfileStack: ProfileMain → BusinessConfig

**Data persistence:** AsyncStorage via repository layer (src/data/repository.js). Schema versioning unified in `ventasv_schema_version` (current v5). Migrations: v1→v2 (AuthContext), v2→v3 (salesMigration.js items[]), v3→v4 (schemaMigrationV4.js entity envelope), v4→v5 (schemaMigrationV5.js Modes). All entities have UUID v4 IDs (newId from src/utils/ids.js) and sync envelope (accountId, deviceId, syncState, serverUpdatedAt).

**Role system:** owner → co-admin → worker (positions: Cajero, Cocinero, Motorista, Camarero)

**Auth rules:**
- PIN exactly 4 digits
- deviceType: fixed = SelectWorker on shift close; personal = direct logout
- Owner can view worker PINs but CANNOT enter their profiles
- Owner can use all tools in their own profile

## Testing

- Runner: jest-expo. Config in package.json `jest` field
- Unit tests (`__tests__/unit/`): auth, businessConfig, cart, displayComponents, formComponents, posScreen, migration, pinEntry, pinKeypadModal, productPermissions, products, roleConfig, geoLogic, itemsLogic, salesMigration, saleDetailItems, salesListSummary, cookModalItems, ticketPrinter, ticketMessage, transferMessage, ids, entityEnvelope, schemaMigrationV4, qentasClient, requiresQentasLogic, upsellCardLogic, businessConfigQentasFields, modes/modeModel, modes/schemaMigrationV5, modes/repositoryModes, modes/modeManagementLogic, modes/modeResolution, modes/posModeFiltering, modes/orderBuilderPricing, modes/modeManagement, modes/modeScheduling, modes/modeEditorLogic, modes/modeAutoActivation, modes/modeProductEditorLogic, collapsibleHeader, iconCatalog, responsive, sales, selectWorker, setup, snackbar, tabs, theme, workers
- Integration tests (`__tests__/integration/`): payment, orders
- Mocks in `__mocks__/` for AsyncStorage, vector-icons, safe-area-context
- Coverage threshold: 70% on branches, functions, lines, statements
- **Rule: 760 tests (minimum), 0 failures before any merge. No exceptions.**
- **AAA Pattern (mandatory):** Every test must follow Arrange-Act-Assert. The Act step must call a real function imported from `src/`. Never reimplement logic in tests. Comments `// Arrange`, `// Act`, `// Assert` are required in every test block.

## Repository

- GitHub: https://github.com/arananestor/VentasSV
- Local clone: ~/lab/VentasSV/

## Branch Workflow — No Exceptions

Never push directly to main or develop. Everything goes through PRs.

`feature/*` or `fix/*` → PR → `develop` → PR → `main` (only when beta is stable)

- `main` — production, protected, requires PR and approval
- `develop` — integration, PRs target this branch
- Feature branches: `feature/*`, fixes: `fix/*`

Claude Code creates the branch, makes changes, pushes, and opens the PR. Nestor reviews Files changed, runs tests locally, and merges.

**Steps for Nestor on every PR received — always include these in full:**

```bash
# Step 1 — Terminal:
git fetch origin
git checkout [branch-name]
git pull origin [branch-name]
npm install
npm test

# Step 2 — GitHub → PR → "Files changed" tab → review changes

# Step 3 — If tests pass and code looks good:
# Merge pull request → Confirm merge → Delete branch

# Step 4 — Terminal:
git checkout develop
git reset --hard origin/develop
npm install && npm test
```

## Commit Convention

Commits always in English: `type(scope): description`

Types: feat, fix, refactor, test, docs, chore, style

No signatures, no attributions. Never include "Co-Authored-By", "Generated with Claude Code", or any similar footer in commits, PRs, or code comments.

## Documentation — Mandatory

```
docs/architecture_design/  ← architecture docs (read before starting)
docs/feature_retros/       ← retrospectives after each merge
```

- Before each major feature: create `docs/architecture_design/[name].md`
- After each merge: create `docs/feature_retros/[date]_[name].md`
- Always read existing docs before starting work

Architecture design docs are REQUIRED before starting any major feature. Feature retros are REQUIRED after every merge to develop. No exceptions. Retros are living documents — if a subsequent PR reveals a retro claimed something was fixed but wasn't, the retro must be corrected in that same PR.

## Development Rules — No Exceptions

- NEVER touch files directly on main
- NEVER update React or native deps without full compatibility verification
- Tests: 0 failures before any merge
- Commits in English, format `type(scope): description`
- UI always in Spanish, code in English
- KeyboardAvoidingView on every screen with inputs
- Pills/cards always adaptive to content (no fixed width)
- No native Alert — always custom modals
- Architecture design doc BEFORE major features
- Feature retro AFTER merge
- Always give Nestor complete, detailed steps for each PR
- Tests: AAA pattern mandatory — Arrange (input), Act (call real function from src/), Assert (verify output). No exceptions.

## Process Rules — Learned from Retros

- **Role changes require global grep**: Any PR that modifies role logic must include `grep -r "role ===" src/` output in the PR description to verify no orphaned role checks exist. (Source: PRs #13, #16 — `role === 'admin'` bug appeared twice)
- **Reuse estimation requires diff analysis**: Before extracting a component for reuse, count actual consumers at the diff level, not by visual similarity. (Source: PR #10-12 retro — StatusBadge/InfoCard had less reuse than estimated)
- **CLAUDE.md must be verified on every PR**: Before opening any PR, read CLAUDE.md and update test counts, suite lists, and priority status if they have changed. This file is the primary context source — if it drifts, all future work drifts with it.
- **Retros must reflect reality**: If a subsequent PR reveals a retro claimed something was fixed but wasn't, the retro must be corrected in that same PR. Retros are living documents, not static snapshots.
- **Execution PRs must complete entire design doc sections**: Before opening a PR, verify every item in the referenced design doc section is fully addressed. If a section says X and Y must change, both X and Y ship in the same PR. No partial implementations.
- **Global impact analysis is mandatory**: Before considering any change complete, grep the entire repo for every modified export, constant, function name, or file path. Update ALL consumers. No orphaned references, no runtime crashes from missed imports. This applies to renames, API changes, constant migrations, and any refactor.
- **Verification logs**: Execution PRs should include temporary `[FASE VERIFY]` console.log blocks (marked `TODO(cleanup-next-pr)`) to confirm infrastructure changes at boot. The PR immediately following must remove them.

## UI Conventions

- Functional components with hooks; contexts consumed via useContext
- IDs generated with `Date.now().toString() + Math.random()`
- Order numbers zero-padded per day (0001, 0002, ...)
- Timestamps as ISO strings
- SVG icons via react-native-svg-transformer (metro.config.js)
- Receipt printing via expo-print; ticket sharing via WhatsApp

## Decision Filter

Before adding any feature, ask: **Does this help a business owner in El Salvador run their business better today?** If not, defer it.

## Communication Style

- Terminal commands always in code blocks
- Numbered steps, clear, nothing omitted
- If a change can break another part of the code, say it BEFORE making the change
- Professional tone — senior engineer level

## Current Priority — Beta v0.1

1. ~~Merge fix/revert-react-version → develop~~ ✅ Done
2. ~~Merge develop → main~~ (Nestor decides when)
3. ~~GitHub Actions CI/CD~~ ✅ Done (PR #7)
4. ~~Extract PinKeypadModal as reusable component~~ ✅ Done (PR #20)
5. ProfileScreen fixes — custom shift modal, compact summary, camera vs gallery
6. Sales date picker + historical CSV export with full columns
7. Verify static map + geo URI flow in SaleDetailScreen
8. Onboarding — solo vs team → configure available tools → lazy loading
9. Owner dashboard — live orders, daily sales, active team
10. Cash register close — for fixed devices on shift change
11. ~~Role interfaces — tab filtering by role/puesto~~ ✅ Done (PR #24)
12. ~~Sale model refactor Fase A — items[], migration v2→v3~~ ✅ Done
13. ~~Sale model refactor Fase B — consumers read items[]~~ ✅ Done
14. ~~Sale model refactor Fase C — ticket, WhatsApp, transfer~~ ✅ Done
15. ~~Foundation Fase F1 — UUIDs, device identity, entity envelope, repository~~ ✅ Done
16. ~~Foundation Fase F2 — Qentas client stub, RequiresQentas, UpsellCard~~ ✅ Done
17. ~~Modos de operación — foundation~~ ✅ Done
18. ~~Modos de operación — cashier view respects active mode~~ ✅ Done
19. ~~Modos de operación — owner management + scheduling~~ ✅ Done
20. Role-specific screens — motorista (entregas), camarero (mesas)
