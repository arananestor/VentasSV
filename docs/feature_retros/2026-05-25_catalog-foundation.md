# Feature Retro: Catalog Foundation

- **Date:** 2026-05-25
- **PR:** feature/catalog-foundation (PR #83)
- **Design doc:** docs/architecture_design/catalog_system_redesign.md (Phases 1-2)

## Resumen

Primer PR del rediseño de catálogos, dividido en 3 PRs después de que Code flagueó el scope original como demasiado grande. Este PR cubre lógica pura: modelo extendido (color, assignedLocationIds), detección de solapamiento de horarios (detectScheduleOverlap), resolución de modo activo con prioridades (getActiveModeAt), y permiso assign-catalog. Zero UI, zero pantallas, zero componentes.

## Cambios

- **src/models/mode.js** — createMode acepta color (string, default '') y assignedLocationIds (array, default []). Sin migración formal.
- **src/utils/modeScheduling.js** — detectScheduleOverlap (solapes parciales, totales, cross-día, evento vs recurrente). getActiveModeAt (prioridades: manual > evento > recurrente > Principal). Helper interno expandToRanges convierte activaciones a rangos de minutos por día.
- **src/utils/permissions.js** — assign-catalog agregado (owner true). Matriz total: 19 acciones.
- **__tests__/unit/modes/modeModel.test.js** — +3 tests: color default, color custom, assignedLocationIds default.
- **__tests__/unit/modes/modeScheduling.test.js** — +15 tests: detectScheduleOverlap (7 tests) + getActiveModeAt (8 tests).
- **__tests__/unit/permissions.test.js** — +2 tests: owner can assign-catalog, co-admin cannot. Matrix integrity actualizado a 19.
- **CLAUDE.md** — 845 tests.

## Qué funcionó

- Extender createMode con campos opcionales con defaults no rompió ningún test existente — los tests anteriores verifican campos específicos, no el shape completo.
- La estructura de datos para activaciones (type 'evento'/'recurrente', days array, startTime/endTime strings, date para eventos) es simple de testear y de expandir a UI en PRs futuros.
- expandToRanges como helper interno encapsula la complejidad de "convertir una activación abstracta a rangos concretos de minutos por día de la semana".

## Lecciones

- **UTC vs local time**: La primera iteración de getActiveModeAt usaba `getHours()` y `getDay()` (local time), pero los tests usan ISO strings UTC. 5 tests fallaron silenciosamente porque el día de la semana calculado estaba desfasado por timezone. El fix fue usar `getUTCHours()` y `getUTCDay()` consistentemente. En producción esto requiere atención: El Salvador está en CST (UTC-6), así que "lunes a las 10am local" es "lunes a las 16:00 UTC". La UI del PR #84 deberá convertir entre local y UTC al guardar/leer horarios.
- **2026-05-25 es lunes, no domingo**: Los tests originales asumían day 0 (Sunday) para esa fecha. Node confirmó que es day 1 (Monday) en UTC. El error era en los fixtures del test, no en la lógica — pero descubrirlo requirió correr los tests y debuggear el day-of-week, no asumirlo.
- **Scope split valió la pena**: El design doc original pedía modelo + scheduling + 6 componentes + pantalla nueva + pantalla refactored + banner + navigation en un solo PR. Code flagueó el riesgo antes de empezar. La división en 3 PRs (Foundation → UI → Integration) mantiene cada PR revisable y testeable de forma independiente. Este PR tiene 20 tests nuevos y cero riesgo de regresión visual.
- **La estructura cross-día**: Representar una activación 23:00-03:00 como `endMin += 24*60` (sumando un día completo de minutos al end) simplifica la detección de overlap a una comparación de rangos lineales en lugar de manejar dos rangos separados. El tradeoff es que la visualización en el calendario semanal (PR #84) tendrá que "splitear" visualmente la banda al cruce de medianoche.
