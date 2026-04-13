# Architecture Design: PinKeypadModal Reusable Component

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-11
- Target branch: refactor/extract-pin-keypad-modal

---

## Problem

The PIN authorization modal with 4 dots + numeric keypad + shake animation exists inline in HomeScreen (lines 467-520, ~53 lines of JSX + ~50 lines of state/logic). ProfileScreen has state variables for a PIN modal (showOwnerPin, ownerPinInput, ownerPinError, pendingAdminAction) but the modal JSX was never connected — requireOwnerPin sets showOwnerPin to true but no CenterModal renders for it. This means admin actions in ProfileScreen that require PIN verification silently fail for non-owner users.

Future screens (cash register close, role interfaces) will also need PIN authorization modals.

---

## Solution

Extract the PIN keypad modal pattern from HomeScreen into a reusable PinKeypadModal component. Replace HomeScreen's inline implementation. Connect ProfileScreen's existing requireOwnerPin logic to the new component.

---

## Changes

### 1. Create src/components/PinKeypadModal.js
- Wraps CenterModal with 4-dot PIN display + numeric keypad + shake animation
- Props: visible, onClose, onVerify (function that receives the PIN and returns boolean), title (optional, default "AUTORIZACIÓN"), subtitle (optional, default "PIN de autorización")
- Handles all internal state: pin string, error state, shake animation
- Auto-verifies when 4 digits entered, calls onVerify(pin)
- If onVerify returns true: calls onClose, resets state
- If onVerify returns false: triggers shake animation, clears pin, shows error
- Cancel button at bottom calls onClose
- Uses ThemeContext for all colors

### 2. Update src/screens/HomeScreen.js
- Remove inline PIN modal JSX (lines 467-520)
- Remove PIN-related state: adminPin, adminPinError, shakeAnim
- Remove handlePinPress, handlePinDelete, shakePin, closeAdminPin functions
- Keep: showAdminPin, pendingAction, requestPinAction (these control when to show the modal and what to do after)
- Import and use PinKeypadModal with onVerify={verifyOwnerPin}
- The closeAdminPin logic moves to onClose callback

### 3. Fix src/screens/ProfileScreen.js
- Remove dead state: ownerPinInput, ownerPinError (no longer needed, PinKeypadModal handles internal state)
- Keep: showOwnerPin, pendingAdminAction, requireOwnerPin
- Remove handleOwnerPinVerify function
- Import and render PinKeypadModal with visible={showOwnerPin}, onVerify={verifyOwnerPin}, onClose that resets showOwnerPin and pendingAdminAction
- This fixes the bug where non-owner users could never complete admin actions in ProfileScreen

---

## Rules

1. PinKeypadModal manages its own pin/error/shake state internally — consumers only pass visible, onClose, onVerify
2. PIN is always exactly 4 digits — this is hardcoded in the component, not configurable
3. The component must look identical to the current HomeScreen implementation
4. All colors from ThemeContext, no hardcoded values
5. Tests must pass with 0 failures

---

## Verification

1. HomeScreen admin PIN modal looks and behaves exactly as before
2. ProfileScreen admin actions (for non-owner users) now show the PIN keypad modal
3. Shake animation fires on wrong PIN in both screens
4. Correct PIN executes the pending action in both screens
5. npm test passes with 0 failures
