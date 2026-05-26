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

## Segundo commit — code-review fixes

Cinco fixes del code-review pre-merge:

**Fix 1 (orden de días):** DayChipsSelector mostraba D-L-M-M-J-V-S (Domingo primero, convención JS) mientras WeekCalendarView mostraba L-M-M-J-V-S-D (Lunes primero, convención salvadoreña). Se unificó a Lunes primero en ambos. DayChipsSelector ahora usa DAYS_ORDER = [1,2,3,4,5,6,0] para mapear índice visual → día JS. El value que sale del onChange sigue siendo en formato JS (0=Dom) porque toda la lógica de scheduling lo espera así. Solo el orden visual cambió.

**Fix 2 (preview vivo):** Se agregó un mini WeekCalendarView dentro del ScheduleSheet que muestra el horario propuesto superpuesto a los existentes. El preview solo aparece cuando los inputs son válidos (fechas/horas con formato correcto). Si detectScheduleOverlap encuentra cruces, se muestra un warning debajo del calendario con el nombre del catálogo en conflicto. maxHeight 200 con overflow hidden mantiene el sheet manejable.

**Fix 3 (export expandToRanges):** WeekCalendarView tenía una copia local de expandActivationToRanges que duplicaba la de modeScheduling.js. Se exportó expandToRanges desde modeScheduling y se eliminó la función local de WeekCalendarView, reemplazando las llamadas por la import. Cero tests rotos porque los tests de WeekCalendarView solo testean computeBandPositions que usa la función internamente.

**Fix 4 (validación):** ScheduleSheet ahora valida fecha (YYYY-MM-DD regex + Date parsing), hora (HH:MM regex con rangos 0-23 y 0-59), y días (array no vacío para recurrente). Errores se muestran en rojo arriba del botón GUARDAR. Se limpian automáticamente al cambiar cualquier input.

**Fix 5 (long press → tap+modal):** El patrón de long press para desasignar empleado en renderEquipo se reemplazó por un TouchableOpacity explícito en el ícono X que abre un CenterModal de confirmación ("¿DESASIGNAR EMPLEADO?" / DESASIGNAR / Cancelar). Sigue el mismo patrón visual que ELIMINAR EMPLEADO en ProfileScreen y ELIMINAR HORARIO en la misma pantalla.

**Issues pendientes para PR #85:** CatalogActiveBanner busca la activation activa iterando scheduledActivations del currentMode buscando endsAt > now — esto no funciona con el shape nuevo de activaciones (que usan startTime/endTime strings, no ISO timestamps). Se resolverá en PR #85 al integrar el banner. Además, el shape de scheduledActivation tiene dos formatos coexistiendo (el legacy de evaluateSchedule con startsAt/endsAt y el nuevo con type/days/startTime/endTime) — la unificación se hará gradualmente.
