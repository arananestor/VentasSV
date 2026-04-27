# Feature Retro: Reusable Component Extraction

- **Date:** 2026-04-09
- **PRs:** #10 (foundation), #11 (form), #12 (display)
- **Architecture doc:** docs/architecture_design/component_extraction.md

## Scope

Extracted 8 reusable components + 2 utility files from 13 screens with duplicated UI code, split across 3 PRs.

### PR 1 — Foundation (merged)
- ScreenHeader, PrimaryButton, Divider, formatters.js, colorUtils.js
- Updated 7 screens: SaleDetail, Sales, Payment, BusinessConfig, OrderBuilder, ManageTabs, AddProduct

### PR 2 — Form (merged)
- ThemedTextInput, CenterModal, BottomSheetModal
- Updated 5 screens: ManageTabs, AddProduct, POSScreen, ProfileScreen, BusinessConfig

### PR 3 — Display
- StatusBadge, InfoCard
- Updated 1 screen: SaleDetailScreen
- Other screens (OrdersScreen, BusinessConfigScreen) had patterns too different to extract cleanly

## What went well

- Architecture design doc before starting kept the scope clear across all 3 PRs
- Splitting into 3 PRs made each one reviewable and independently mergeable
- All 292 lines of new component/utility code are reusable across future screens
- Zero test failures throughout — every PR passed all existing tests plus new ones
- No visual regressions — pixel-perfect replacements in every screen

## What went wrong

- StatusBadge and InfoCard had less reuse than anticipated: OrdersScreen uses dynamic color+opacity badges, BusinessConfigScreen uses conditional border/text colors, SelectWorkerScreen uses icon-based pills — all too different from the standard pattern
- The architecture doc estimated 5+ screens for StatusBadge and 3+ for InfoCard, but only 1 screen (SaleDetailScreen) had the exact reusable pattern for both
- Overestimating pattern similarity led to creating components with limited initial adoption

## Lesson

- Before writing an architecture doc, do a diff-level analysis of the actual code patterns, not just a visual similarity check. Two elements that look similar on screen may have fundamentally different implementations (dynamic colors, conditional styling, different layouts)
- Start with the highest-impact extractions first (ScreenHeader in 7 screens, CenterModal in 5 modals) — these deliver the most value
- Components with only 1 current consumer still have value for future screens (dashboard, onboarding, role interfaces will all use StatusBadge and InfoCard)
