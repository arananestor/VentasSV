# Feature Retro: Catalog UI Components + CatalogDetailScreen

- **Date:** 2026-05-26
- **PR:** feature/catalog-ui (PR #84)
- **Design doc:** docs/architecture_design/catalog_system_redesign.md (Phases 3-5)

## Resumen

Segunda fase del rediseño de catálogos. 6 componentes UI nuevos + CatalogDetailScreen con 5 tabs internos + registro en AppNavigator. CatalogDetailScreen coexiste con ModeEditorScreen — ningún path navega a ella todavía. Integración en PR #85.

## Cambios

- **src/components/InternalTabs.js** (nuevo) — Tabs controlados con underline activa, scrollable horizontal.
- **src/components/DayChipsSelector.js** (nuevo) — 7 chips toggleables + "Toda la semana" + "Lun a Vie".
- **src/components/CatalogColorPicker.js** (nuevo) — Grid de 12 colores + input hex custom con validación. Exports: CATALOG_COLORS, isValidHex (testeable).
- **src/components/WeekCalendarView.js** (nuevo) — SVG con grid 7 días x 18 horas (6am-midnight). Bandas coloreadas por activación. Export: computeBandPositions (testeable). Consume react-native-svg ya instalado.
- **src/components/CatalogActiveBanner.js** (nuevo) — Banner "VENDIENDO AHORA" con countdown live. Construido pero NO consumido por ninguna screen todavía. Export: formatCountdown (testeable).
- **src/components/ScheduleSheet.js** (nuevo) — Sheet de programación con tipo evento/recurrente, DayChipsSelector, campos de hora, detección de solape via detectScheduleOverlap, modal de conflicto con 3 opciones.
- **src/screens/CatalogDetailScreen.js** (nuevo) — 5 tabs: Detalles (nombre, desc, color, badges PRINCIPAL/ACTIVO), Productos (toggle + price override), Equipo (asignar/desasignar workers), Locales (oculto), Horario (WeekCalendarView + lista + ScheduleSheet).
- **App.js** — CatalogDetailScreen registrada en ProfileStack. ModeEditorScreen se mantiene.
- **__tests__/unit/** — catalogColorPicker (7 tests), weekCalendarView (6 tests), catalogActiveBanner (7 tests).
- **CLAUDE.md** — 867 tests, 59 suites. Patterns InternalTabs y Catalog UI components documentados.

## Qué funcionó

- WeekCalendarView con SVG resultó más manejable de lo anticipado gracias a que computeBandPositions es una función pura separada del render. La conversión de activaciones a rectángulos posicionados es matemática simple: (startMin - baseHour) / 60 * hourHeight. El SVG solo renderiza los resultados.
- CatalogDetailScreen con 5 tabs internos se mantiene legible porque cada tab es una función render separada. El estado se comparte a nivel del componente (name, desc, color, overrides) y cada tab lee/muta solo lo que necesita.
- ScheduleSheet con detección de conflicto reusa detectScheduleOverlap del PR #83 sin duplicar lógica.

## Lecciones

- El primer test de cross-day en WeekCalendarView esperaba 2 bandas para una activación 23:00-03:00, pero la segunda banda (00:00-03:00 del día siguiente) se clampa a 0 porque el calendario solo muestra 6am-midnight. El test se corrigió para reflejar que solo la porción visible (23:00-midnight) genera banda. Un segundo test con un rango 20:00-10:00 (donde la porción next-day 06:00-10:00 SÍ es visible) confirmó que el clamping funciona correctamente con 2 bandas.
- CatalogActiveBanner está construido pero no consumido. Esto es intencional — la integración en POSScreen/OrdersScreen/SalesScreen se hace en PR #85. Permite testear el componente en aislamiento y evitar conflictos de merge con screens que otros PRs podrían tocar.
- La coexistencia temporal de CatalogDetailScreen y ModeEditorScreen es safe porque comparten cero state. AppNavigator registra ambas y ningún path navega a CatalogDetail todavía. En PR #85 se cambiará el tap de ManageModesScreen para navegar a CatalogDetail en lugar de ModeEditor.
