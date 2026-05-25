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
npm test               # Run all tests (825 tests, 56 suites — must be 0 failures)
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

**Established Architecture Patterns:**

- Responsive layout: `useResponsive` hook in `src/hooks/useResponsive.js` returns reactive primitives (width, height, isTablet, isLandscape, padding, gap, columns, gridCardSize, layout, fontSize). Mandatory for any screen with dynamic width-based computations. Current consumers: POSScreen, AddProductScreen, OrderBuilderScreen, SelectWorkerScreen, OrdersScreen.
- Modal backdrops: Pressable plus StyleSheet.absoluteFill is the single accepted pattern. Reference: `src/components/CenterModal.js`. Consumers: CenterModal, BottomSheetModal, ModeEditorScreen modal, OrdersScreen modal, ProfileScreen modal.
- Owner avatar treatment: when rendering any worker avatar (initial circle), use backgroundColor based on role with `worker.role === 'owner' ? theme.accent : (worker.color || '#1C1C1E')`, and initial color with `worker.role === 'owner' ? theme.accentText : '#fff'`. Consumers using this pattern: ProfileScreen, SelectWorkerScreen, ManageModesScreen. The owner is the only worker with the theme accent color treatment.
- Owner work mode: when `worker.role === 'owner'`, the field `ownerMode` (`'operativo'` or `'administrativo'`) controls visible tabs via `getTabsForWorker` in `src/utils/roleConfig.js`. Operativo is a superset of administrativo (administrative tabs + operational tabs + future role-specific tabs). Administrativo shows only administrative tabs (currently only Profile; future Owner Dashboard joins this set). Default is operativo. Workers without the field are treated as operativo (no formal migration). Toggle exposed in ProfileScreen with mandatory confirmation modal.
- Co-admin permissions matrix: declarative system in `src/utils/permissions.js`. PERMISSIONS constant maps role to allowed actions. `can(worker, action)` is a pure function. `useCan(action)` is the React hook consuming AuthContext (`src/hooks/useCan.js`). Restricted screens use useCan to filter UI or show defensive empty states. Co-admin has full operational permissions (POS, orders, day sales, shift sharing, basic employee info) and zero administrative permissions including catalog access by default (catalog visibility is reserved for a future per-worker override system tied to the catalog system redesign). Pattern documented in `docs/architecture_design/co_admin_permissions_matrix.md`.
- Bottom sheets: `src/components/BottomSheetModal.js` for non-destructive sheets. Consumers: CartSheet, SimpleProductSheet.
- Icon and color picker: `src/components/IconColorPicker.js` unifies icon catalog and color selection in one searchable categorized grid. Source of icons and helpers: `src/constants/productConstants.js` (ICON_CATALOG with 11 categories, searchIcons, getIconCols, getIconBtnSize).
- User feedback API: showSnack for persistent post-sale snackbar, showNotif for informational toast of 2 to 3 seconds, CenterModal for destructive confirmations with explicit button. All exposed from AppContext.
- Photo picker: `src/components/PhotoPickerSheet.js` wraps BottomSheetModal with two options (Tomar foto / Elegir de galería). Handles requestCameraPermissionsAsync and requestMediaLibraryPermissionsAsync internally. Current consumer: ProfileScreen. Pending migration to AddProductScreen, PaymentScreen, ModeEditorScreen, BusinessConfigScreen (see Active priorities).
- Skills mapping (architect orchestration): The architect invokes specialized skills according to this table at the corresponding phase of work. Process, not goodwill.

  | Fase del trabajo | Skill | Cuándo invocar |
  |---|---|---|
  | Discovery técnico de feature | engineering:architecture | Antes del design doc, si la feature tiene decisiones arquitectónicas reales (schema, auth, navigation, modelos de datos) |
  | Discovery de UX y microcopy | design:ux-copy | Cuando el design doc define texto en pantalla (labels, errores, descripciones, CTAs) |
  | Pre-merge del execution PR | engineering:code-review | Después de que Code abra el PR, antes de que Nestor mergee |
  | Test strategy | engineering:testing-strategy | Cuando la feature toca lógica crítica (auth, pagos, datos sensibles, migraciones) |
  | Cierre de semana | engineering:standup | Resumen de PRs mergeados + próximos pasos |
  | Pre-beta pública | design:accessibility-review | Antes de release a usuarios reales |
  | Auditoría periódica | engineering:tech-debt | Cada 20 a 30 PRs |

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
- Unit tests (`__tests__/unit/`): auth, businessConfig, cart, displayComponents, formComponents, posScreen, migration, pinEntry, pinKeypadModal, productPermissions, products, roleConfig, geoLogic, itemsLogic, salesMigration, saleDetailItems, salesListSummary, cookModalItems, ticketPrinter, ticketMessage, transferMessage, ids, entityEnvelope, schemaMigrationV4, qentasClient, requiresQentasLogic, upsellCardLogic, businessConfigQentasFields, modes/modeModel, modes/schemaMigrationV5, modes/repositoryModes, modes/modeManagementLogic, modes/modeResolution, modes/posModeFiltering, modes/orderBuilderPricing, modes/modeManagement, modes/modeScheduling, modes/modeEditorLogic, modes/modeAutoActivation, modes/modeProductEditorLogic, collapsibleHeader, iconCatalog, permissions, responsive, sales, salesCsv, shareShiftSummary, shiftSummary, selectWorker, setup, snackbar, tabs, theme, workers
- Integration tests (`__tests__/integration/`): payment, orders
- Mocks in `__mocks__/` for AsyncStorage, vector-icons, safe-area-context
- Coverage threshold: 70% on branches, functions, lines, statements
- **Rule: 825 tests (minimum), 0 failures before any merge. No exceptions.**
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
- **Design doc decision rule**: A separate design doc PR is required when the change involves architectural decisions, schema migrations, new patterns, multi-module impact, or UX trade-offs worth debating before code. Housekeeping, local refactors, doc updates, and scoped bug fixes go in a single PR with a rich description. When in doubt, default to separating. (Source: PR #73 sync cycle)
- **Release cadence**: Every 10 PRs merged to develop, open a release PR develop → main. The release PR carries no commits of its own — it only promotes the accumulated work. The next release after PR #74 will be at the PR #84 mark. (Source: PR #73 sync cycle)
- **Polish phase patterns are mandatory project-wide**: Alert.alert is forbidden — use showNotif for informational messages, CenterModal for destructive confirmations. Dimensions.get('window') at module level is forbidden — use the useResponsive hook. Modal backdrops must use Pressable plus StyleSheet.absoluteFill, never TouchableOpacity as overlay. (Source: PRs #70, #72)
- **Animation restrictions in ScrollView contexts**: Only transform and opacity may animate, always with useNativeDriver: true. Animating height, margin, or padding inside a ScrollView is forbidden. (Source: collapsibleHeader.js, PR #63)
- **react-native-reanimated is blocked**: It requires full babel plugin config and native rebuild, incompatible with the current pinned setup. Do not propose it as a solution.
- **Architect carry-over check**: Before passing a new instruction block to Claude Code, the architect must verify that all previously identified fixes from earlier discussions have been committed. If a block was prepared but Nestor pivoted to a new issue before executing it, include those pending fixes in the next block. Pending fixes never get silently dropped when focus shifts. (Source: PR #76 fourth refinement, missed carry-over of PinEntryScreen fix)
- **Retros are written from reality, not from prediction**: Architect instructions describe what the executor should do and instruct the executor to write the retro at the end based on what actually happened during execution — including unexpected bugs, dependency issues, route changes, mid-flight decisions, things that worked first try vs things that needed iteration. Architect may suggest baseline structure and minimum points to cover; never dictate retro content verbatim. (Source: PR #76 process observation by Nestor)
- **Skills orchestration rule**: The architect must follow the skills-mapping table in CLAUDE.md (Established Architecture Patterns → Skills mapping) and announce at the top of every instruction block: which skills were invoked, which were evaluated and discarded with reason, and which will be invoked pre-merge. Nestor can audit at any time with "¿qué skills usaste para esto?". Process, not goodwill. (Source: PR #78 architect process formalization)
- **Design docs born from ADR include Alternatives Considered**: When a design doc is produced after invoking engineering:architecture, the document must include sections "Alternatives Considered" with the options evaluated (table of dimensions per option) and "Trade-off Analysis" with reasoning. The Problem/Solution/Changes/Rules/Verification format of the repo extends — it does not replace — the ADR rigor. Without these sections the ADR is wasted. (Source: PR #78 ADR-to-design-doc preservation)
- **New restricted features must register their action in the permissions matrix**: When introducing a feature that should be restricted by role (financial data, configuration, employee management), the action must be added to `src/utils/permissions.js` with explicit role assignments, and the consuming screen must invoke `useCan(action)`. Adding a feature without registering its permission means defaulting to "everyone sees it" — the inverse of secure-by-default. (Source: PR #80 co-admin permissions matrix)

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

**Active priorities:**

1. Release develop → main on PR #74 cycle, every 10 PRs thereafter
2. Sales date picker + historical CSV export with full columns
3. Verify static map + geo URI flow in SaleDetailScreen
4. Onboarding — solo vs team → configure available tools → lazy loading
5. Owner dashboard — live orders, daily sales, active team
6. Cash register close — for fixed devices on shift change
7. Photo picker global migration — AddProductScreen, PaymentScreen, ModeEditorScreen, BusinessConfigScreen consume PhotoPickerSheet
8. Role-specific screens — motorista (entregas), camarero (mesas)

**Completed milestones:**

- ~~Foundation: revert React version, GitHub Actions CI/CD (PR #7), Extract PinKeypadModal (PR #20), Role interfaces tab filtering (PR #24)~~
- ~~Sale model refactor: Fase A items[] migration v2→v3, Fase B consumers read items[], Fase C ticket WhatsApp transfer~~
- ~~Foundation sync-ready: F1 UUIDs and entity envelope, F2 Qentas client stub with RequiresQentas and UpsellCard~~
- ~~Modos de operación: foundation, cashier view respects active mode, owner management with scheduling~~
- ~~Polish phase: POS collapsible header (PR #63), CartSheet extracted (PR #61), SimpleProductSheet extracted (PR #62), AddProduct responsive and redesign (PRs #64 #68), OrderBuilder responsive and redesign (PRs #69 #70), Icon catalog categories with unified IconColorPicker (PR #67), Header gap fix (PR #66), Global Alert.alert and Dimensions.get cleanup with BottomSheetModal backdrop fix (PRs #70 #72)~~
- ~~ProfileScreen fixes: shift summary modal, compact band, unified photo picker, iOS photo bug fix, CSV export, owner avatar harmony (PR #76)~~
- ~~Owner mode toggle: operativo vs administrativo with confirmation modal (PR #78)~~
- ~~Co-admin permissions matrix: declarative can(worker, action) with useCan hook, restricted screens with defensive empty states (PR #80)~~
