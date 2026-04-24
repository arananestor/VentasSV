# Feature Retro: Sale Model Refactor — Fase B (Consumers)

- **Date:** 2026-04-13
- **PR:** #30
- **Architecture doc:** docs/architecture_design/sale_items_refactor.md

## What was done

- **SaleDetailScreen** — renders sale.items.map() with per-item productName, size, quantity, subtotal, note, units (with cookLevel display). Shows "PRODUCTOS (N)" header when multi-item.
- **SalesScreen** — uses getSaleSummary(sale) for row text, shows "N productos" count instead of single product details.
- **OrdersScreen** — cards show items as comma-joined product names, "N productos" count. CookModal flattens all units across items for cooking workflow. Detail view shows items summary.
- **AppContext** — new updateSaleItemUnit(saleId, itemIndex, unitIndex, cookLevel) action for cook tracking.
- **saleDetailLogic.js** — new utility: getItemSections, shouldShowNote, formatExtras, formatItemLine, hasPaymentDetails.
- **cookModalLogic.js** — new utility: getItemsNeedingCook, updateUnitCookLevel, areAllUnitsCooked.

## Decisions

- Extracted pure logic to saleDetailLogic.js and cookModalLogic.js for testability.
- CookModal flattens all units across all items into a single page flow (consistent with existing UX).
- updateUnitCookLevel is immutable — returns new sale object without mutating.

## Shims retired vs remaining

- **Retired** (Fase B): SaleDetailScreen, SalesScreen, OrdersScreen — all `TODO(fase-b)` shims removed.
- **Remaining** (Fase C): ticketPrinter.js (1 shim), businessConfig.js (2 shims) — these stay until Fase C.

## Tests added

- saleDetailItems.test.js: 12 tests
- salesListSummary.test.js: 6 tests
- cookModalItems.test.js: 12 tests
- Total: 520 tests, 27 suites, 0 failures

## Pending for Fase C

- ticketPrinter.js: generateTicketHTML loop items[]
- businessConfig.js: buildTicketMessage, buildTransferMessage loop items[]
- AppContext handleSnackWhatsApp: use updated builder
- Remove remaining 3 `TODO(fase-b)` shims
