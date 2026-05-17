# Architecture Design: POSScreen UI Improvements

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-09
- Target branch: fix/ui-improvements

---

## Problem

POSScreen has several UI issues that hurt usability and don't meet beta quality standards:
1. PIN authorization modal uses a plain text input instead of a numeric dot-based keypad
2. PIN is requested too frequently — even for non-critical actions by the owner
3. Header is oversized with "VENTASSV PUNTO DE VENTA" title that wastes vertical space
4. Filter tabs (Todos/Fijos/Eventos) add complexity that isn't needed for beta
5. Bottom navigation bar overlaps with Android system navigation buttons on some devices

---

## Solution

### 1. PIN Modal Redesign
- Replace TextInput with 4 circular dots that fill as digits are pressed
- Custom numeric keypad (1-9, 0, delete) built into the modal
- Dots animate on fill and shake on error
- Inspired by iPhone lock screen pattern
- Uses ThemeContext for all colors

### 2. PIN Authorization Rules
PIN should ONLY be required for critical actions:
- Deleting a product
- Accessing ManageTabs (category management)

PIN should NOT be required for:
- Adding a product (if worker is owner or co-admin)
- Editing a product (if worker is owner or co-admin)
- Entering edit mode (if worker is owner or co-admin)

### 3. Header Redesign
- Remove large "VENTASSV PUNTO DE VENTA" title
- Minimal header: green status dot + worker name + edit button
- Clean, modern look inspired by Uber/Spotify
- More vertical space for products

### 4. Hide Filter Tabs
- Hide Todos/Fijos/Eventos buttons from the UI
- Keep the code commented out for post-beta reactivation
- Only show product category tabs (Principal, etc.)

### 5. Safe Area Fix
- Use useSafeAreaInsets() from react-native-safe-area-context
- Add proper bottom padding to the tab navigator
- Prevents overlap with Android system navigation buttons
- Works on all devices: notch, no-notch, gesture nav, button nav

---

## Rules

1. All components use ThemeContext — no hardcoded colors
2. No visual changes to other screens — only POSScreen and App.js (tab navigator)
3. Tests must pass after changes
4. The app must remain fully functional
