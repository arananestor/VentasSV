# Feature Retro: Employee-Catalog Conflict Detection Foundation

- **Date:** 2026-05-27
- **PR:** feature/employee-conflicts-foundation (PR #91)
- **Design doc:** docs/architecture_design/employee_catalog_conflicts.md

## Resumen

Foundation de la detección de conflictos empleado-catálogo. Función pura detectEmployeeConflicts(modes) que detecta cuando un empleado está asignado a dos catálogos con horarios cruzados. Tres helpers puros para formateo, avatares en celda, y check de conflicto por celda. 24 tests AAA. Zero UI, zero screens, zero componentes.

## Cambios

- **src/utils/employeeConflicts.js** (nuevo) — detectEmployeeConflicts builds workerId→modes mapping, pairwise compares scheduledActivations via expandToRanges, returns conflicts with shape { workerId, modeIdA, modeIdB, day, startMin, endMin }. Dedup via Set con key compuesto. modeIdA consistently first in array order.
- **src/utils/conflictHelpers.js** (nuevo) — getConflictDescription (format for modal text), computeAvatarsInCell (max 3 visible + overflow count), hasConflictInCell (range overlap check). All consume expandToRanges.
- **__tests__/unit/employeeConflicts.test.js** (nuevo) — 18 tests: edge cases (empty, null, single mode, distinct workers), detection (overlap, partial, cross-day, multi-worker, pairwise), complex (isDefault neutral, boundary exclusive, dedup, shape, ordering).
- **__tests__/unit/conflictHelpers.test.js** (nuevo) — 6 tests: description shape, avatar count (0, 2, 5 workers), hasConflict (true, false, boundary exclusive).
- **CLAUDE.md** — 881 tests, 60 suites. Employee conflict detection pattern documented.

## Qué funcionó

- Reuso directo de expandToRanges de modeScheduling: la función ya maneja cross-day splitting y produce ranges con {day, startMin, endMin}. detectEmployeeConflicts la consume para comparar pairwise sin reimplementar lógica de rangos.
- La deduplicación con Set + key compuesto (`workerId|modeIdA|modeIdB|day|startMin|endMin`) es simple y determinística. El ordering de modeIdA/B está garantizado por el orden de iteración del array de modes (modeIndices[i] < modeIndices[j] siempre).
- Separar conflictHelpers del módulo principal fue correcto: getConflictDescription y computeAvatarsInCell necesitan access a modes y workers arrays (para lookup de nombres/colores), pero detectEmployeeConflicts es self-contained con solo modes. Separar evita que el módulo de detección dependa de workers.

## Lecciones

- La boundary exclusiva (A termina 15:00, B empieza 15:00 → sin conflict) se hereda de la comparación `oStart < oEnd` (strict less-than). Si A.endMin = 900 y B.startMin = 900, max(900,900) = 900, min(endA, endB) depende pero oStart === oEnd → no pasa el `oStart < oEnd` check. Esto es consistente con detectScheduleOverlap del PR #85.
- El design doc estimó ~20 tests para employeeConflicts y ~6 para helpers (26 total). La implementación resultó en 18 + 6 = 24. La diferencia: algunos tests del design doc eran redundantes con otros que ya cubrían el caso (ej. "worker en 3+ modes simultáneos devuelve pairwise" es cubierto por el test de "3 modes con mismo worker overlap múltiple").
- El architect aplicó el scope pre-flight check ANTES de entregar este bloque — primera vez que no requirió que Code lo flagee. El split foundation/integration es el patrón probado de PRs #83/#84/#85.
