# Feature Retro: Testing Infrastructure

**Date:** 2026-04-07
**Feature:** Jest unit and integration test suite
**PRs:** #2 (setup/testing-infrastructure → develop)
**Status:** Shipped to develop

---

## What Went Well

### 1. 119 tests passing on first run in CI equivalent
All 10 suites passed cleanly once jest-expo was correctly installed. The test logic was sound from the start — the failures were configuration issues, not logical errors in the tests themselves.

### 2. Test coverage matches real risk
The tests were written to protect what actually breaks in production: PIN validation, cart totals, schema migration, payment logic, order status transitions. Not abstract coverage for the sake of a number.

### 3. AsyncStorage mock resolved cleanly
The native module conflict was isolated to a single mock file. All tests that import AuthContext now work without requiring a real device or simulator.

### 4. npm scripts are clean and usable
`npm test`, `npm run test:unit`, `npm run test:integration`, `npm run test:coverage` all work. The developer experience is straightforward.

---

## What Went Wrong

### 1. Files were created on the server but never committed before the conversation continued
Work was done in the server environment, tests were confirmed passing, but a `git push` never happened. When the user ran `git pull`, nothing appeared. The tests had to be recreated from scratch in a second pass.

**Impact:** Wasted a full cycle. The user saw empty folders and lost confidence in the process.

**Lesson:** Every working session that produces files must end with a commit and push before reporting completion. "Tests are passing" means nothing until the code is in the remote.

### 2. The first PR was opened against `main` instead of `develop`
The PR was created pointing to `main`, which triggered the branch protection rules. The PR had to be closed and recreated.

**Impact:** Confusion about how PRs work, extra steps, minor trust hit.

**Lesson:** Always verify the base branch before opening a PR. The command before pushing should confirm: `git checkout develop` is the target, not `main`.

### 3. `@testing-library/react-native` is incompatible with React 19.1.0
The standard React Native testing library requires `react-test-renderer@19.2.4` which does not exist yet for React 19.1.0. Installing it with `--legacy-peer-deps` produces an unstable setup.

**Impact:** Component-level UI tests are blocked. Only logic tests are possible right now.

**Lesson:** Check library compatibility before promising a capability. The correct answer was "we can test all logic now, UI component tests are blocked by a React 19 compatibility issue that is upstream and not in our control."

### 4. `develop` branch was not pushed to remote before starting work
The `develop` branch was created locally but the push failed due to missing credentials. The user then worked on `main` directly for several commits before the branch structure was established.

**Impact:** Several commits landed on `main` that should have gone through `develop`. The branch discipline started late.

**Lesson:** Branch structure must be established on day one, before any feature work begins. The first thing in a new repo is: create `develop`, push it, protect both branches.

---

## Process Improvements

### Commit before reporting
No feature is "done" until the commit is pushed and confirmed on the remote. The report to the user comes after `git push`, not after `npm test`.

### PR base verification
Before `git push`, always confirm the PR target:
1. Is `develop` pushed to remote?
2. Is the feature branch based on `develop`?
3. Will the PR open against `develop`, not `main`?

### Compatibility check before install
Before adding any devDependency, verify compatibility with the current React and React Native versions. If there is a conflict, document it immediately and propose the best available alternative.

---

## Codebase Knowledge Gained

| Item | Detail |
|---|---|
| Test runner | jest-expo ~54.0.0, compatible with Expo SDK 54 + React 19.1.0 |
| UI test blocker | @testing-library/react-native incompatible with React 19.1.0 |
| AsyncStorage mock | `__mocks__/@react-native-async-storage/async-storage.js` |
| Test structure | `__tests__/unit/` and `__tests__/integration/` |
| Coverage threshold | 70% branches, functions, lines, statements |
| Scripts | test, test:watch, test:coverage, test:unit, test:integration |
| Branch discipline | feature/* and fix/* → develop → main |

---

## Summary

The testing infrastructure is solid. 119 tests covering the full business logic layer pass cleanly and consistently. The foundation is correct.

The execution had two real failures: code that was never pushed, and a PR that went to the wrong branch. Both are process failures, not technical ones.

The UI component testing gap is real but upstream — it resolves when `@testing-library/react-native` ships React 19 support. When that lands, component snapshot tests follow immediately.

For the next feature, the discipline is: push first, report second. Branch target confirmed before PR. Compatibility verified before install.
