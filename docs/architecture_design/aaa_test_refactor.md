# Architecture Design: AAA Test Pattern Enforcement

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-12
- Target branch: refactor/aaa-test-pattern

---

## Problem

The current test suite (321 tests, 20 suites) has a critical quality problem: the majority of tests do NOT follow the Arrange-Act-Assert (AAA) pattern. Instead, they:

1. **Reimplemented logic inline** — Functions like `getTodaySales`, `loginWithPin`, `isAdmin`, `buildTicketMessage`, `removeWorker`, and `canSave` are rewritten inside the test files instead of being imported from the real source. If the real function changes, the test still passes because it verifies its own copy.

2. **Tested literal constants** — Tests like `expect(120).toBe(120)` or `expect({ fontSize: 10 }.fontSize).toBe(10)` verify that a hardcoded value equals itself. These provide zero protection against regressions.

3. **Tested JavaScript primitives** — Tests like `expect(0.50 * 4).toBeCloseTo(2.00)` verify JavaScript arithmetic, not app behavior.

4. **Missing Act step** — Many tests only have Arrange + Assert with no Act on real system code. Example: creating a mock object and asserting its properties exist.

This means the test suite gives a false sense of security. A bug in any real function could pass all tests because tests don't exercise real code.

---

## Solution

Refactor ALL 20 test suites to strictly follow the AAA (Arrange-Act-Assert) pattern:

- **Arrange**: Set up input data (mock workers, products, sales, etc.)
- **Act**: Call the REAL function imported from the REAL source file
- **Assert**: Verify the output matches expectations

### Mandatory AAA Rules (apply to ALL tests from now on):

1. Every test MUST have all three parts: Arrange, Act, Assert
2. The Act step MUST call a real function imported from `src/` — never reimplemented logic
3. If a function is not directly importable (e.g., it lives inside a React component), extract its pure logic into a utility and import that
4. No test may verify a literal it just created (e.g., `const x = 5; expect(x).toBe(5)`)
5. No test may verify JavaScript built-in behavior (arithmetic, string methods, array methods) unless testing a wrapper
6. Comments `// Arrange`, `// Act`, `// Assert` are REQUIRED in every test block for readability and enforcement

### Strategy for non-importable logic:

Some logic currently lives inside React components (useState callbacks, inline handlers). For these:

- Extract the pure business logic into utility functions in `src/utils/` files
- Import those utilities in both the component and the test
- The component becomes thinner, the logic becomes testable

### Utility files to create:

1. **`src/utils/pinLogic.js`** — PIN accumulation, verification trigger at 4 digits, delete logic, dots display. Used by: PinEntryScreen, PinKeypadModal, HomeScreen
2. **`src/utils/cartLogic.js`** — Cart total calculation, add/remove item logic, clear cart. Used by: AppContext, HomeScreen
3. **`src/utils/salesLogic.js`** — Today's sales filter, order number formatting, sale status transitions, change calculation, change label. Used by: AppContext, SalesScreen, PaymentScreen
4. **`src/utils/workerLogic.js`** — Login matching, PIN validation, isAdmin check, owner detection, remove worker guard, verify owner PIN. Used by: AuthContext, HomeScreen, ProfileScreen
5. **`src/utils/orderLogic.js`** — Order status filtering, status transitions (next/prev), unit structure validation. Used by: OrdersScreen
6. **`src/utils/uiLogic.js`** — StatusBadge size variants, dot color resolution, avatar initial extraction, puesto display formatting. Used by: various display components
7. **`src/utils/validationLogic.js`** — Product name validation, price validation, WhatsApp number validation, bank config completeness. Used by: AddProductScreen, BusinessConfigScreen

Note: `src/utils/formatters.js`, `src/utils/ticketPrinter.js`, and `src/utils/businessConfig.js` already exist and can be imported directly.

---

## Changes

### Phase 1: Extract utility modules from components

Create the 7 new utility files listed above. Each exports pure functions that are currently inlined in components or contexts. Keep the function signatures simple and obvious.

### Phase 2: Update source files to use new utilities

Refactor components and contexts to import and call the extracted utilities instead of having inline logic. This ensures the tests verify the SAME code path the app uses.

### Phase 3: Rewrite all 20 test suites

Every test file gets rewritten following AAA strictly. Each test:

```javascript
it('description of behavior', () => {
  // Arrange
  const input = { ... };

  // Act
  const result = realFunction(input);

  // Assert
  expect(result).toBe(expectedValue);
});
```

#### File-by-file plan:

**Unit tests (18 files):**

1. `auth.test.js` — Import `generatePin`, `PUESTOS`, `PUESTO_ICONS` (already imported). Tests are OK but add AAA comments.
2. `businessConfig.test.js` — Import `loadWhatsAppNumber` validation logic, `buildTicketMessage`, `isComplete` from `src/utils/validationLogic.js` and `src/utils/businessConfig.js`. Stop reimplementing `build()`.
3. `cart.test.js` — Import `calculateCartTotal`, `addToCart`, `removeFromCart`, `clearCart` from `src/utils/cartLogic.js`. Stop testing JS arithmetic.
4. `displayComponents.test.js` — Import `getStatusBadgeSizeConfig`, `getDotColor` from `src/utils/uiLogic.js`. Stop testing literal objects.
5. `formComponents.test.js` — Import validation and default resolution logic from `src/utils/uiLogic.js`. Remove pure constant assertions.
6. `homeScreen.test.js` — Import `isAdminUser` from `src/utils/workerLogic.js`, import PIN logic from `src/utils/pinLogic.js`. Stop reimplementing isAdmin.
7. `migration.test.js` — Already good. Add AAA comments. Verify it still imports `migrateWorkers`.
8. `pinEntry.test.js` — Import PIN logic from `src/utils/pinLogic.js` and worker matching from `src/utils/workerLogic.js`.
9. `pinKeypadModal.test.js` — Import PIN accumulation, auto-verify, reset logic from `src/utils/pinLogic.js`. Remove `expect(true).toBe(true)`.
10. `productPermissions.test.js` — Import `canSave` from `src/utils/workerLogic.js` (or keep inline if it stays simple). Add AAA comments.
11. `products.test.js` — Import validation functions from `src/utils/validationLogic.js`. Stop only verifying mock data structure.
12. `sales.test.js` — Import `filterTodaySales`, `formatOrderNumber`, `calculateChange`, `getChangeLabel` from `src/utils/salesLogic.js`. Stop reimplementing filter logic.
13. `selectWorker.test.js` — Already good with jest.fn(). Add AAA comments. Import `getAvatarInitial`, `getPuestoDisplay` from `src/utils/uiLogic.js`.
14. `setup.test.js` — Import `buildOwnerData` from `src/utils/workerLogic.js`. Stop reimplementing buildOwner.
15. `snackbar.test.js` — Import snackbar config constants from a utility or from AppContext if exported. Remove literal-equals-literal tests entirely.
16. `tabs.test.js` — Import tab filtering, add/remove product logic from TabContext or extracted utility.
17. `theme.test.js` — Import `DARK_THEME`, `LIGHT_THEME`, `getNextTheme` from ThemeContext. Stop hardcoding token objects in tests.
18. `workers.test.js` — Import `loginMatch`, `isValidPin`, `isAdmin`, `canRemoveWorker`, `verifyOwnerPin` from `src/utils/workerLogic.js`.

**Integration tests (2 files):**

19. `payment.test.js` — Import `canCompletePayment`, `calculateChange` from `src/utils/salesLogic.js`, import `buildSaleData` from `src/utils/salesLogic.js`. These are close to AAA already but reimplemented inline.
20. `orders.test.js` — Import `filterByStatus`, `getNextStatus`, `getPrevStatus` from `src/utils/orderLogic.js`.

### Phase 4: Update CLAUDE.md

- Update test count and suite count after refactor
- Add AAA testing rule to the Testing section
- Add AAA to the Development Rules section

---

## Rules

1. **AAA is mandatory** — Every single test must have Arrange, Act, Assert with comments. No exceptions.
2. **Import real code** — The Act step must call a function imported from `src/`. Never reimplement logic in tests.
3. **No literal-verifies-literal** — Tests like `expect(5).toBe(5)` must be deleted or rewritten to test real behavior.
4. **No JS-built-in tests** — Don't test that `0.5 * 4 === 2`. Test that `calculateCartTotal(cart)` returns the right number.
5. **Extract before test** — If logic lives inside a component, extract to a utility first, then test the utility.
6. **Preserve test count** — The refactored suite must have AT LEAST the same number of tests (321+). Add more if gaps are found.
7. **Zero failures** — `npm test` must pass with 0 failures after refactor.
8. **Don't break source behavior** — Extracting utilities must not change any visible behavior. Components must produce the same output.
9. **Pure functions only in utilities** — No React hooks, no AsyncStorage, no side effects in utility files. They receive data and return data.
10. **Use existing utilities** — `src/utils/formatters.js`, `src/utils/businessConfig.js`, `src/utils/ticketPrinter.js` already exist. Import from them where applicable.

---

## Verification

1. `npm test` — 0 failures, 321+ tests passing
2. `npm run test:coverage` — 70%+ threshold maintained
3. Every test file must contain `// Arrange`, `// Act`, `// Assert` comments
4. `grep -rn "from '../../src/" __tests__/` — every test file imports from real source
5. `grep -rn "expect(true).toBe(true)" __tests__/` — returns 0 results
6. `grep -rn "expect(false).toBe(false)" __tests__/` — returns 0 results
7. Manual spot-check: change a real function's return value, verify at least one test fails (proves tests are connected to real code)
8. App runs correctly on device — no visual or behavioral changes
