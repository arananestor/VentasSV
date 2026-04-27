# Feature Retro: UX Overhaul — Rename to Catálogo, Tips, Worker Bubbles, Decimal Fix, Snackbar

- **Date:** 2026-04-19
- **PR:** #39

## Resumen

Rename completo de "Modo/Modos" a "Catálogo/Catálogos" en toda la UI visible. UpsellCards reemplazadas por tips informativos no interactivos. Worker bubbles en cards de catálogo. Fix de input decimal para priceOverride. Snackbar contextual con campo message. Action pills con feedback visual animado. Borde izquierdo verde para catálogo activo.

## Cambios por archivo

- **ManageModesScreen.js** — rename strings, worker bubbles con foto/initial, tips informativos (no UpsellCards), ActionPill con Animated.spring, borde izquierdo verde para activo, snackbar con message contextual
- **ModeEditorScreen.js** — rename strings, fix decimal input (priceInputs raw string state, parseFloat solo al guardar), keyboardType decimal-pad, snackbar con message
- **POSScreen.js** — "Catálogo:" en vez de "Modo:" en el indicador
- **ProfileScreen.js** — "Catálogos" con subtítulo "Crear, editar y programar catálogos"
- **AppContext.js** — error messages renombrados a "catálogo", snackbar soporta campo message
- **modeManagement.js** — error message renombrado a "catálogo"
- **modeManagementLogic.test.js** — strings de assertion actualizados
- **modeEditorLogic.test.js** — 3 tests nuevos de decimal parsing

## Qué funcionó

- El rename fue limpio: solo textos visibles al usuario cambiaron, todos los identificadores de código mantienen mode/Mode en inglés
- priceInputs como raw string resuelve el problema de "10." desapareciendo — parseFloat solo se aplica al guardar
- Tips informativos se ven mucho más sutiles que UpsellCards — no confunden al usuario

## Qué ajustaríamos

- El calendario visual y el swipe-to-toggle quedaron fuera de este PR por complejidad — son mejoras de UX puras que se pueden agregar en un PR dedicado sin cambiar lógica
- Worker bubbles son placeholders visuales en Fase 0 — solo muestran al currentWorker del catálogo activo

## Notas

- Los archivos internos mantienen mode/Mode como identificador en inglés
- Los docs y retros históricos mantienen "Modo" — son registros históricos
- El design doc NO se tocó — sigue diciendo "Modo" como referencia de arquitectura
