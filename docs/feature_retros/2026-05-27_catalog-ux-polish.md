# Feature Retro: Catalog UX Polish

- **Date:** 2026-05-27
- **PR:** fix/catalog-ux-polish (PR #89)
- **Design doc:** none (UX polish from device testing of PR #87)

## Resumen

Cinco fixes UX del testing en device del rediseño de catálogos. Reveal backgrounds con opacity animada, inputs de fecha DD-MM-AAAA y hora 12h con AM/PM (convención LatAm), palette rotativa para catálogos sin color, modal scrolleable, y terminología "cruce" en lugar de "solapa". Fix 3c (side-by-side overlap layout) diferido a PR futuro por complejidad de algoritmo.

## Cambios

- **src/screens/ManageModesScreen.js** — SwipeableCatalogCard: reveal backgrounds convertidos a Animated.View con opacity interpolada del translateX. Desaparecen cuando la card vuelve a posición 0.
- **src/components/TimeInputAmPm.js** (nuevo) — Componente reutilizable para input de hora 12h con chips AM/PM. Exports: convertTo24h, formatTimeInput, isValidTime12. Auto-formatting: inserta ":" después del 2do dígito.
- **src/components/ScheduleSheet.js** — Reescrito. Fecha: auto-format DD-MM-AAAA con guiones automáticos, keyboardType number-pad, conversión interna a ISO. Hora: TimeInputAmPm con toggle AM/PM, conversión a 24h al guardar. ScrollView wrapper para contenido que excede viewport. Terminología: "CRUCE DE HORARIOS", "se cruza con", "REEMPLAZAR EN EL CRUCE".
- **src/components/WeekCalendarView.js** — Palette rotativa: modes sin color usan CATALOG_COLORS[index % 12]. Bandas: margin horizontal 4px (era 2), borderRadius 5 (era 3), borde sólido de 1px, texto visible si height > 24px (era 30).
- **CLAUDE.md** — Regla "Architect scope pre-flight check" extendida con evaluación de complejidad de tareas.

## Qué funcionó

- TimeInputAmPm como componente separado fue la decisión correcta: 75 líneas con auto-formatting, validación 1-12, y conversión AM/PM → 24h. Reutilizable si otra pantalla necesita hora.
- La palette rotativa con CATALOG_COLORS[index % 12] resuelve el "todo azul" sin requerir que el usuario asigne colores manualmente. Los 12 colores del palette tienen contraste suficiente para distinguir hasta 12 catálogos simultáneos.
- El formatDateInput con guiones automáticos fue directo: strip non-digits, insert guión después de chars 2 y 4. El usuario solo teclea números.

## Lecciones

- **Fix 3c diferido correctamente.** Side-by-side overlap layout requiere un algoritmo de sub-column assignment (similar a Google Calendar). Estimé 40-50 líneas de lógica pura + cambios de render. Claude Code lo flageó como complejidad extra que excede el threshold del PR. La regla pre-flight check se extendió para capturar esto: tres o más tareas con algoritmo novel = split obligatorio.
- **La convención LatAm para fechas (DD-MM-AAAA) y hora (12h con AM/PM) es natural para el mercado salvadoreño.** ISO (YYYY-MM-DD) y 24h son convenciones técnicas, no de usuario. El input acepta solo números + auto-format, eliminando errores de formato. La conversión a ISO/24h es interna y transparente.
- **El modal del ScheduleSheet no scrolleaba** porque el contenido del BottomSheetModal se renderiza dentro de un View con maxHeight fijo. Envolver en ScrollView dentro del BottomSheetModal (no fuera) resolvió sin tocar el componente base.

## Segundo commit — 3 bugs de device testing

**Fix 1 (duplicate spring-back):** El swipe derecha (duplicar) animaba la card fuera de pantalla con Animated.timing → screenWidth, dejando un hueco invisible. Duplicar es no-destructivo — la card original debe quedarse. Fix: swipe derecha usa Animated.spring → 0 (vuelve a posición) y ejecuta onSwipeRight en el callback. Solo el swipe izquierda (eliminar, destructivo) anima hacia afuera.

**Fix 2 (calendario respeta color asignado):** El check `(mode?.color)` era truthy para strings no vacíos pero no verificaba explícitamente `!== ''`. Cuando mode.color era `''` (default), el fallback rotativo funcionaba. Pero si mode.color tenía un valor asignado por el owner, debía usarlo directamente. Fix: check explícito `mode?.color && mode.color !== ''` antes del fallback rotativo. También se agregó guardia `modeIdx >= 0` para evitar CATALOG_COLORS[-1].

**Fix 3 (dos campos HH:MM):** TimeInputAmPm reescrito con dos TextInput separados (HH y MM) + separador ":" visual + chips AM/PM. Antes era un solo campo con auto-formatting "07:00" — ambiguo sobre dónde terminaba la hora y empezaban los minutos. Con dos campos de maxLength=2 cada uno, el usuario ve claramente que puede poner cualquier minuto. Auto-pad: "5" al salir del campo MM → "05". convertTo24h ahora recibe (hourStr, minuteStr, isPM) en lugar de (timeStr, isPM). ScheduleSheet actualizado: 6 states (startHour, startMin, startPM, endHour, endMin, endPM) en lugar de 4.

**Diferido a PR arquitectónico futuro:** La lógica de un empleado que no puede estar asignado a dos catálogos en la misma franja horaria. Requiere un verificador cross-mode que valide assignedWorkerIds vs scheduledActivations de todos los modes — scope de diseño, no de UX polish.
