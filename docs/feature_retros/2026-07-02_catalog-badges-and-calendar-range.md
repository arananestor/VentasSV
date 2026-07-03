# Feature Retro: Catalog Badges Cleanup + Calendar Range Selection

- **Date:** 2026-07-02
- **Branch:** fix/catalog-badges-and-calendar-range
- **Design doc:** N/A (UX fixes from production testing)

## Resumen

Dos fixes de UX identificados durante pruebas de produccion: (1) badges "PRINCIPAL" y "ACTIVO" redundantes y poco profesionales en CatalogDetailScreen, (2) CalendarPicker no soportaba seleccion de rango de fechas estilo Airbnb para eventos multi-dia.

## Cambios

- **src/screens/CatalogDetailScreen.js** — Eliminados badges "PRINCIPAL" y "ACTIVO" del tab Detalles. La info de catalogo activo ya la provee CatalogActiveBanner. Tab Horario: display de rango de fechas para eventos multi-dia.
- **src/screens/ManageModesScreen.js** — Eliminado badge "Activo", conservado solo "Principal" en las cards. Removido style `badges` (wrapper ya no necesario).
- **src/components/CatalogSwitcherSheet.js** — Eliminado badge "ACTIVO", conservado "PRINCIPAL". Removido style `badges`.
- **src/components/CalendarPicker.js** — handleDayPress: tap 1 selecciona inicio, tap 2 selecciona fin (si es antes del inicio, swap automatico; si es el mismo dia, single-day). Auto-close en segundo tap cuando onSelectEnd es provisto.
- **src/components/ScheduleSheet.js** — Nuevo estado `endDate` para eventos. buildActivation produce `{ date, endDate }` para eventos. Display muestra "DD-MM-YYYY → DD-MM-YYYY" para rangos. Validacion: endDate no puede ser antes de date. CalendarPicker recibe onSelectEnd, auto-cierra al seleccionar fin.
- **src/utils/modeScheduling.js** — expandToRanges: evento con endDate itera todos los dias del rango generando ranges por dia. getActiveModeAt: compara dateStr con rango date-endDate en lugar de igualdad exacta.
- **__tests__/unit/modes/modeScheduling.test.js** — +3 tests: multi-day evento overlap, active on middle day, not active outside range.
- **CLAUDE.md** — 885 tests.

## Que funciono

- La logica interna de isDefault, currentModeId, fallback a principal, y proteccion de borrado se mantuvo intacta. Solo se limpio la UI de los badges.
- CalendarPicker ya tenia la estructura para range selection (startDate, endDate, isBetween). El fix fue conectar ScheduleSheet correctamente con onSelectEnd y agregar auto-close.
- expandToRanges con while loop sobre Date objects es simple y correcto para rangos cortos (eventos de dias, no meses).

## Lecciones

- Los badges "PRINCIPAL" y "ACTIVO" eran redundantes porque CatalogActiveBanner ya muestra que catalogo esta vendiendo. Mantener "Principal" solo en ManageModesScreen cards y CatalogSwitcherSheet es suficiente como indicador sutil.
- El CalendarPicker tenia range logic muerta porque ningun consumer pasaba onSelectEnd. El patron correcto era que CalendarPicker detecte si onSelectEnd existe para decidir single-date vs range mode.
- El swap automatico (si tap 2 < tap 1, intercambiar) evita un estado de error comun sin necesidad de mensaje de validacion.

## Test count

885 tests, 60 suites, 0 failures (+3 tests nuevos para multi-day evento).
