# Feature Retro: Modos de Operación — Foundation (PR 1)

- **Date:** 2026-04-14
- **PR:** #36
- **Architecture doc:** docs/architecture_design/modos_de_operacion.md

## Resumen

Infraestructura invisible para Modos de operación. El cajero no ve cambios. Internamente la app tiene un modelo Mode, migración v4→v5 que crea "Principal", y AppContext expone CRUD de Modos.

## Cambios

1. **Limpieza logs F1/F2** — removidos los bloques `[F1 VERIFY]` y `[F2 VERIFY]` de AppContext.loadData según la regla de cleanup.
2. **Mode model** (src/models/mode.js) — `createMode`, `normalizeProductOverrides`, `buildPrincipalMode`. IDs UUID v4.
3. **Repository** — STORAGE_KEYS.modes y .currentModeId. `getCurrentModeId()`, `setCurrentModeId(modeId)`.
4. **Schema migration v5** (src/utils/schemaMigrationV5.js) — `migrateToV5` crea Modo "Principal" con todos los productos activos y tabOrder de tabs actuales. Idempotente.
5. **AppContext** — v4→v5 migration en loadData, useState para modes/currentModeId, funciones expuestas: `setCurrentMode`, `createModeFromForm`, `updateMode`, `deleteMode`, `cloneMode`, `currentMode` derivado.
6. **Logs MODOS-F1** — temporales, tagueados `TODO(cleanup-next-pr)`, confirman schema=5, modes count, currentModeId, active products count.

## Qué funcionó

- Patrón de migración idempotente probado en v3→v4 se replicó limpiamente en v4→v5.
- buildPrincipalMode genera el Modo inicial sin modificar ningún dato existente.
- Deep copy en cloneMode previene mutaciones compartidas (bug encontrado y arreglado en tests).

## Qué ajustaríamos

- El test de repositoryModes requirió mockResolvedValueOnce porque el mock de AsyncStorage no persiste — esto es un patrón conocido pero requiere atención en cada test nuevo.

## Notas para el siguiente PR

- feature/modos-cajero-ui debe empezar borrando los logs [MODOS-F1 VERIFY].
- POSScreen debe filtrar productos por productOverrides.active del currentMode.
- OrderBuilder debe leer priceOverride cuando exista.
