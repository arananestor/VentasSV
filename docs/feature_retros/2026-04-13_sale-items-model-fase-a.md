# Feature Retro: Sale Model Refactor — Fase A

- **Date:** 2026-04-13
- **PR:** #29
- **Architecture doc:** docs/architecture_design/sale_items_refactor.md

## What was done

- **itemsLogic.js** — buildSaleItem, buildMultiItemSaleData, getSaleItemCount, getSaleSummary, validateSale
- **salesMigration.js** — migrateSaleV2toV3 (idempotent), migrateAllSalesV2toV3
- **AppContext.js** — auto-migration v2→v3 on loadData, items[] validation in addSale, single-URL WhatsApp in snackbar
- **PaymentScreen.js** — replaced for-loop (N addSale calls) with single buildMultiItemSaleData + addSale. Both cart and legacy single-product paths consolidated.
- **Consumer shims** — SaleDetailScreen, SalesScreen, OrdersScreen, ticketPrinter.js, businessConfig.js all read `sale.items?.[0]?.X ?? sale.X` with `// TODO(fase-b)` comments

## Decisions

- **Shims with TODO(fase-b)**: temporary compatibility layer so the app works with v3 data while Fase B rewrites consumers properly. Every shim is marked for removal.
- **Idempotent migration**: migrateSaleV2toV3 checks for items[] before wrapping. Running loadData twice is safe.
- **Validation in addSale**: throws if items[] missing or empty. Catches broken callers immediately.
- **Single checkout path**: both cart mode and legacy single-product mode use buildMultiItemSaleData. No branching.

## What will break if you don't know

- **Fase B must remove all shims** marked with `TODO(fase-b)`. Until then, multi-item sales show only the first item in consumers.
- **Fase C must update ticket/WhatsApp builders** to loop items[]. Until then, tickets show only the first product.

## Tests

- itemsLogic.test.js: 14 tests (buildSaleItem, buildMultiItemSaleData, getSaleItemCount, getSaleSummary, validateSale)
- salesMigration.test.js: 9 tests (v2 migration, idempotency, toppings→extras, field removal, defaults)
- Total: 490 tests, 24 suites, 0 failures

## Pending for Fase B

- SaleDetailScreen: render sale.items.map(...) instead of shim
- SalesScreen: show getSaleSummary(sale) instead of single productName
- OrdersScreen + CookModal: show items as sub-list, mark cookLevel per unit
- Remove ALL `// TODO(fase-b)` shims
