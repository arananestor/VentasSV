# Feature Retro: Catálogos — Auto-activation by Worker Assignment

- **Date:** 2026-04-20
- **PR:** fix/catalogos-auto-activation

## Resumen

Implementada auto-activación de catálogo basada en worker assignment. Al hacer login, el catálogo asignado al worker se activa automáticamente. Eliminado el botón manual "Activar" de ManageModesScreen. Fix del color de avatar del owner en ProfileScreen.

## Cambios por archivo

- **src/utils/modeManagement.js** — nueva función `findModeForWorker(modes, workerId)`: busca en assignedWorkerIds, fallback a isDefault, null si vacío
- **src/context/AppContext.js** — `autoActivateForWorker(workerId)` usa findModeForWorker + setCurrentMode. useEffect observa currentWorker y activa al cambiar
- **src/screens/ManageModesScreen.js** — eliminados: handleActivate, ActionPill "Activar", CenterModal tipo 'activate'. Solo queda CenterModal de eliminación
- **src/screens/ProfileScreen.js** — 3 fallbacks de avatar color cambiados de theme.accent a '#1C1C1E'
- **CLAUDE.md** — 697 tests, 48 suites, modeAutoActivation en lista

## Qué funcionó

- findModeForWorker como función pura hace la lógica testeable sin React
- El useEffect con [currentWorker?.id, modes] captura tanto login como cambios de asignación en tiempo real
- Eliminar el botón Activar simplifica la UI sin perder funcionalidad

## Qué ajustaríamos

- El color '#1C1C1E' es hardcoded — idealmente debería ser un token de theme (ej. theme.avatarFallback). Pero crear un nuevo token de theme es scope creep para este PR.

## Lecciones

- La auto-activación es el modelo mental correcto para un POS: el owner asigna catálogos a workers, y cada worker ve su catálogo al entrar. No tiene sentido que un worker active manualmente un catálogo.
