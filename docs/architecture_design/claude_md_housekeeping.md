# Architecture Design: CLAUDE.md Housekeeping

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-11
- Target branch: docs/update-claude-md

---

## Problem

CLAUDE.md contains outdated information that causes Claude Code to operate with incorrect context:

1. Test count says "212 tests, 15 suites" — actual is 300 tests, 19 suites
2. Unit test list missing: homeScreen, formComponents, displayComponents, productPermissions
3. Priority list outdated: items 1-2 done (fix/revert-react-version merged), item 6 no longer planned (PINs stay at 4 digits), item 10 done (GitHub Actions CI via PR #7)
4. No process rules codified from 7 retrospectives
5. No rule requiring CLAUDE.md verification on every PR

---

## Solution

Update CLAUDE.md to reflect current reality and add process rules extracted from retros.

---

## Changes

### Section: Commands > Testing
Replace "212 tests, 15 suites" with "300 tests, 19 suites"

### Section: Testing
Replace "Rule: 212 tests, 0 failures" with "Rule: 300 tests (minimum), 0 failures"

Update unit test list to all 17 suites:
auth, businessConfig, cart, displayComponents, formComponents, homeScreen, migration, pinEntry, productPermissions, products, sales, selectWorker, setup, snackbar, tabs, theme, workers

### New Section: Process Rules — Learned from Retros (after Development Rules)
- Role changes require global grep: any PR modifying role logic must include grep -r "role ===" src/ to verify no orphaned checks exist (Source: PRs #13, #16)
- Reuse estimation requires diff analysis: count actual consumers at diff level, not visual similarity (Source: PRs #10-12 retro)
- CLAUDE.md must be verified on every PR: update test counts, suite lists, priorities if changed

### Section: Current Priority — Beta v0.1
Replace entire list with:
1. ~~Merge fix/revert-react-version → develop~~ Done
2. ~~Merge develop → main~~ (Nestor decides when)
3. ~~GitHub Actions CI/CD~~ Done (PR #7)
4. Extract PinKeypadModal as reusable component — standardize PIN modal across all screens
5. ProfileScreen fixes — custom shift modal, compact summary, camera vs gallery
6. Sales date picker + historical CSV export with full columns
7. Verify static map + geo URI flow in SaleDetailScreen
8. Onboarding — solo vs team → configure available tools → lazy loading
9. Owner dashboard — live orders, daily sales, active team
10. Cash register close — for fixed devices on shift change
11. Role interfaces — cajero (POS), cocinero (comandas), motorista (entregas), camarero (mesas)

---

## Rules

- Zero code changes, documentation only
- No risk of regression

---

## Verification

Run npm test to confirm 300 tests / 19 suites still pass (no code changed, but good hygiene)
