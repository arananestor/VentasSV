# Feature Retro: Rename HomeScreen to POSScreen + useResponsive Migration

- **Date:** 2026-04-27
- **PR:** refactor/pos-screen-migration

## Resumen

Renamed HomeScreen.js → POSScreen.js. Migrated from static Dimensions.get('window') to useResponsive hook for dynamic grid calculations. Test files renamed accordingly.

## Cambios

- **src/screens/HomeScreen.js → src/screens/POSScreen.js** — function renamed to POSScreen, Dimensions import removed, useResponsive provides CARD_SIZE/PADDING/CARD_GAP dynamically. Grid/card styles moved inline for dynamic sizing.
- **App.js** — import updated to POSScreen. HomeMain screen name preserved for navigation compatibility.
- **__tests__/unit/homeScreen.test.js → posScreen.test.js** — describe blocks renamed.
- **__tests__/unit/modes/homeScreenModeFiltering.test.js → posModeFiltering.test.js** — describe blocks renamed.
- **CLAUDE.md** — all HomeScreen references → POSScreen, test suite names updated.

## Decisiones

- Navigator screen name "HomeMain" stays unchanged to avoid breaking navigation from other screens. Only the component and file name changed.
- Static StyleSheet styles that depended on CARD_SIZE/PADDING moved to inline styles since they're now runtime values from useResponsive.

## Lecciones

- Renaming a screen that's referenced in navigation requires careful grep across all files — the navigator name and component name are independent.
