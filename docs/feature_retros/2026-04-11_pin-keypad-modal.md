# Feature Retro: PinKeypadModal Reusable Component

- **Date:** 2026-04-11
- **PR:** #20
- **Architecture doc:** docs/architecture_design/pin_keypad_modal.md

## Changes

1. **PinKeypadModal component** — extracted from HomeScreen's inline PIN modal (~100 lines of JSX + state + animation). Props: visible, onClose, onVerify, title, subtitle. Manages pin/error/shake internally.
2. **HomeScreen cleanup** — removed adminPin, adminPinError, shakeAnim state, handlePinPress, handlePinDelete, shakePin, closeAdminPin functions, and 53 lines of inline modal JSX. Replaced with single `<PinKeypadModal />` tag.
3. **ProfileScreen bug fix** — removed dead state (ownerPinInput, ownerPinError) and dead function (handleOwnerPinVerify). Connected existing requireOwnerPin logic to PinKeypadModal. Non-owner users can now complete admin actions in ProfileScreen.

## What went well

- Architecture design doc (PR #19) defined exact changes — zero ambiguity during implementation
- HomeScreen went from ~100 lines of PIN code to 7 lines (import + component)
- ProfileScreen bug was a silent failure — requireOwnerPin set showOwnerPin=true but nothing rendered. Now it works.
- 21 new tests cover component props, internal state, verification flow, and both consumers

## What went wrong

- The ProfileScreen bug existed since the original implementation — requireOwnerPin was written but the modal was never connected. No test caught this because it was a rendering gap, not a logic error.

## Lesson

- When writing state + handler functions, always verify the corresponding JSX renders. Dead state variables (used in logic but never in JSX) are a code smell for missing UI.
- Architecture docs that identify bugs (like the ProfileScreen gap) make the fix a natural part of the extraction rather than a separate emergency PR.
