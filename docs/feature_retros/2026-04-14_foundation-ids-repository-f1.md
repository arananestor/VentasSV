# Feature Retro: Foundation Fase F1 — IDs, Device Identity, Entity Envelope, Repository

- **Date:** 2026-04-14
- **PR:** #33
- **Architecture doc:** docs/architecture_design/foundation_sync_ready.md

## What was done

- **ids.js** — manual UUID v4 implementation (Math.random based, ~15 lines). `newId()` + `isValidUuid()`.
- **entityEnvelope.js** — `attachEnvelope`, `markPending`, `markSynced`. Pure, idempotent.
- **schemaMigrationV4.js** — `migrateEntityToV4`, `migrateCollectionToV4`. Adds envelope to entities missing it.
- **deviceId.js** — service with in-memory cache. `getDeviceId()` generates/persists UUID on first call.
- **repository.js** — centralized data layer wrapping AsyncStorage. `init()`, `getAll()`, `save()`, `upsert()`, `remove()`. All writes go through here.
- **AppContext** — loadData runs v3→v4 migration on all collections. `addProduct`/`addSale` use `newId()`. All writes via repository.
- **AuthContext** — worker IDs use `newId()`. All writes via repository.
- **TabContext** — tab IDs use `newId()`. All writes via repository.
- **salesLogic.js** — `buildSaleData` uses `newId()`.

## Decisions

- **Manual UUID v4 instead of `uuid` package**: the `uuid` npm package uses ESM exports which Jest (with jest-expo preset) can't parse without custom transformIgnorePatterns config. A manual 15-line implementation using Math.random avoids the dependency entirely. For production-grade randomness, `react-native-get-random-values` can be added later.
- **No polyfill needed**: since we don't use the uuid package, no `import 'react-native-get-random-values'` needed in App.js.
- **Cart keeps Date.now IDs**: cart is ephemeral session state, never persisted, never synced. Same for OrderBuilder unit IDs.
- **BusinessConfig storage**: bank config and WhatsApp number writes stay direct to AsyncStorage for now — they're standalone config values, not entity collections. Fase F2 will address this.
- **ventasv_schema_version**: unified key replaces ventasv_sales_schema_version. The old key is kept but ignored.

## Compat check

- Expo SDK 54 + React 19.1.0: no dependencies added (manual UUID). Zero compat risk.

## Tests added

- ids.test.js: 6 tests
- entityEnvelope.test.js: 12 tests
- schemaMigrationV4.test.js: 10 tests
- Total: 576 tests, 33 suites, 0 failures

## Pending for Fase F2

- qentasClient.js stub with stable contract
- RequiresQentas gate component
- UpsellCard placeholder
- BusinessConfig Qentas fields (qentasConnected, qentasAccountId)
