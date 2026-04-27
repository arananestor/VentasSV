# Architecture Design: Reusable Component Extraction

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-09
- Target branch: refactor/extract-foundation-components (PR 1), refactor/extract-form-components (PR 2), refactor/extract-display-components (PR 3)

---

## Problem

13 screens with 400+ lines of duplicated UI code. Only 1 reusable component exists (ProductSticker). Same buttons, headers, modals, inputs, and cards are rebuilt from scratch in every screen. This makes the codebase harder to maintain and slower to build new features on.

---

## Solution

Extract 8 core reusable components + 2 utility files. Split into 3 PRs to keep each one reviewable.

---

## PR 1 — Foundation Components (highest impact)

### ScreenHeader
- Used in: 7+ screens (SaleDetail, Sales, Payment, BusinessConfig, OrderBuilder, ManageTabs, PinEntry)
- Props: title, onBack, rightAction (optional icon + onPress)
- Replaces: Duplicated header + back button pattern (width: 44, height: 44, borderRadius: 22)

### PrimaryButton
- Used in: 10+ screens
- Props: label, onPress, disabled, variant (primary/secondary/danger)
- Replaces: Identical borderRadius: 16, paddingVertical: 18 buttons everywhere

### Divider
- Used in: 3+ screens
- Props: spacing (optional margin)
- Replaces: { height: 1, backgroundColor: theme.cardBorder } pattern

### formatters.js (utility)
- formatDate(isoString) — returns date in Spanish format
- formatTime(isoString) — returns 12hr time
- methodLabel(method) — returns Spanish label for payment methods

### colorUtils.js (utility)
- getTextColor(hexBackground) — returns black/white based on contrast

---

## PR 2 — Form Components

### ThemedTextInput
- Used in: 5+ screens (BusinessConfig, Setup, ManageTabs, Profile, AddProduct)
- Props: label, value, onChangeText, placeholder, error, prefix (optional), keyboardType
- Replaces: Duplicated styled TextInput pattern

### CenterModal
- Used in: 4+ screens (POSScreen admin PIN, ManageTabs, Profile)
- Props: visible, onClose, title, children
- Replaces: Duplicated overlay + centered card pattern

### BottomSheetModal
- Used in: 3+ screens (POSScreen cart, AddProduct)
- Props: visible, onClose, title, children
- Replaces: Duplicated bottom sheet overlay pattern

---

## PR 3 — Display Components

### StatusBadge
- Used in: 5+ screens (SaleDetail, Sales, POSScreen, ManageTabs)
- Props: label, color, size (small/medium)
- Replaces: Badge/status indicator pattern

### InfoCard
- Used in: 3+ screens (SaleDetail, BusinessConfig, SelectWorker)
- Props: label, value, icon (optional)
- Replaces: Cards with title/value pairs

---

## Rules

1. Every component uses ThemeContext — no hardcoded colors
2. Components go in src/components/
3. Utilities go in src/utils/
4. Each screen using a duplicated pattern gets updated to use the new component
5. Tests must pass (212, 0 failures) after each PR
6. No visual changes — the app must look exactly the same before and after

---

## What This Enables

- New screens (dashboard, onboarding, role interfaces) build 3x faster
- UI consistency guaranteed across the entire app
- Theme changes propagate everywhere automatically
- Code reviews are faster because screens are shorter
