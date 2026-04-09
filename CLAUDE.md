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
npm test               # Run all tests (212 tests, 15 suites — must be 0 failures)
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

**Data persistence:** AsyncStorage with schema versioning (current v2). Migration logic in AuthContext.

**Role system:** owner → co-admin → worker (positions: Cajero, Cocinero, Motorista, Camarero)

**Auth rules:**
- PIN exactly 4 digits
- deviceType: fixed = SelectWorker on shift close; personal = direct logout
- Owner can view worker PINs but CANNOT enter their profiles
- Owner can use all tools in their own profile

## Testing

- Runner: jest-expo. Config in package.json `jest` field
- Unit tests (`__tests__/unit/`): auth, cart, migration, products, sales, tabs, workers, businessConfig, theme, snackbar, setup, pinEntry, selectWorker
- Integration tests (`__tests__/integration/`): payment, orders
- Mocks in `__mocks__/` for AsyncStorage, vector-icons, safe-area-context
- Coverage threshold: 70% on branches, functions, lines, statements
- **Rule: 212 tests, 0 failures before any merge. No exceptions.**

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

## Documentation — Mandatory

```
docs/architecture_design/  ← architecture docs (read before starting)
docs/feature_retros/       ← retrospectives after each merge
```

- Before each major feature: create `docs/architecture_design/[name].md`
- After each merge: create `docs/feature_retros/[date]_[name].md`
- Always read existing docs before starting work

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

1. Merge `fix/revert-react-version` → `develop` (ready, 212 tests passing)
2. Merge `develop` → `main` (once #1 is in develop)
3. Onboarding — solo vs team → configure available tools → lazy loading
4. Owner dashboard — live orders, daily sales, active team
5. ProfileScreen fixes — custom shift modal, card → profile summary, camera vs gallery, remove admin bar
6. PinEntryScreen — adaptive dots per worker digit count
7. Role interfaces — cajero (POS), cocinero (comandas), motorista (entregas), camarero (mesas)
8. Cash register close — for fixed devices on shift change
9. Feature retros — add retro for each completed feature
10. GitHub Actions — CI/CD to run tests on every PR
