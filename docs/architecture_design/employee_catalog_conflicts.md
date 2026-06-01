# Architecture Design: Employee-Catalog Conflict Detection and Resolution

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-05-27
- Target branch: feature/employee-conflicts

---

## Problem

VentasSV permite asignar empleados (workers) a catálogos (modes) y programar horarios. El sistema actual NO detecta cuando un empleado queda asignado a dos catálogos con horarios cruzados al mismo tiempo.

Ejemplo real: María en "Almuerzo" Lun-Vie 11:00-15:00. María también en "Cumpleaños familia López" Lunes 13:00-16:00. El lunes de 13:00 a 15:00, María "debería" trabajar en dos catálogos simultáneamente. Físicamente imposible.

Hoy no hay detección, no hay prevención, no hay alerta. El owner se entera el día del evento — pierde clientes y dinero. Nestor lo marcó como "imperdonable".

## Decision

Construir un sistema declarativo de detección de conflictos empleado-catálogo con tres puntos de aplicación:

1. Función pura detectEmployeeConflicts(modes) que calcula todos los conflicts en runtime. Devuelve array de { workerId, modeIdA, modeIdB, day, startMin, endMin }.

2. Detección preventiva en UI:
   - Tab Equipo de CatalogDetailScreen: al asignar empleado nuevo, recalcular conflicts. Si hay conflict involucrando ese empleado, modal de resolución.
   - Tab Horario: al guardar nuevo horario (vía ScheduleSheet), recalcular conflicts considerando todos los empleados asignados al catálogo. Si hay conflict, modal.

3. Visualización en WeekCalendarView:
   - Cada banda de catálogo muestra avatares de empleados asignados (max 3 + "+N" si hay más).
   - Si la celda tiene conflict, borde 2px rojo + ícono alert-triangle pequeño esquina superior.

Resolución del conflict (en el modal): owner elige una de tres opciones según el contexto:
- Quitar empleado del catálogo nuevo (deshacer la asignación reciente).
- Quitar empleado del catálogo existente (mantener la nueva, liberar la vieja).
- Cancelar (revertir sin guardar).

Granularidad por catálogo, no por franja. Si el owner quiere granularidad finer, ajusta horarios.

Conflicts NO se persisten — se calculan runtime cada vez que cambia un mode.

---

## Alternatives Considered

### Opción A — Detección preventiva + modal de resolución (elegida)

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Media |
| Costo | Cero deps |
| Escalabilidad | Alta — O(W × M² × A²), aceptable para escala VentasSV |
| Familiaridad | Media — patrón nuevo en VentasSV pero estándar UX mobile |

Pros: owner no comete el error operativo. Visualización clara con avatares en calendario. Modal explícito de resolución. Cero sorpresas el día del evento.

Contras: más código UI (modal nuevo + avatares en celdas). Algoritmo con doble bucle.

### Opción B — Detección reactiva (warning post-asignación, no bloqueante)

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Baja |
| Familiaridad | Alta |

Pros: implementación trivial. Notif después de guardar.

Contras: owner ignora warning → conflict latente → sorpresa operativa el día del evento. Mala UX. Nestor lo marcó como inaceptable.

### Opción C — Persistir conflicts como entidad

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Alta |

Pros: auditable, historial.

Contras: sincronización compleja (conflicts stale al cambiar horarios). No agrega valor proporcional al costo. Overkill para escala VentasSV.

### Opción D — Prohibir asignación múltiple per se

| Dimensión | Evaluación |
|-----------|-----------|
| Familiaridad | Alta |

Pros: imposible tener conflict.

Contras: sobre-restrictivo. María puede estar en Almuerzo Lun-Vie y Cena Sáb-Dom legítimamente sin conflicto.

---

## Trade-off Analysis

Opción A vs B: A previene el error, B lo permite con warning. La diferencia es UX crítica para el caso salvadoreño donde el owner se compromete con clientes (cumpleaños, eventos) y un empleado faltante = cliente perdido. La complejidad extra de A está justificada.

Opción A vs C: A es runtime, C persiste. Persistir conflicts añade complejidad de sincronización al cambiar horarios (los conflicts persistidos quedan stale). Runtime es siempre verdad actual.

Opción A vs D: D bloquea casos legítimos (María en Almuerzo y Cena en días distintos). Demasiado restrictivo.

Elección: A.

---

## Microcopy del modal (validado con design:ux-copy)

Modal de conflict al asignar empleado (Tab Equipo):

- Ícono: Feather alert-circle en círculo, color theme.danger.
- Título: "{NOMBRE} YA TIENE HORARIO".
- Cuerpo: "{Nombre} ya está asignada a "{Catálogo existente}" el {día} de {hora} a {hora}. No puede estar en dos catálogos al mismo tiempo. ¿Qué querés hacer?"
- Botón primario: QUITAR DE "{Catálogo nuevo}" (deshacer asignación reciente).
- Botón secundario: QUITAR DE "{Catálogo existente}" (liberar el viejo, mantener el nuevo).
- Botón terciario: Cancelar.

Modal de conflict al guardar horario (Tab Horario):

- Ícono: mismo alert-circle.
- Título: "EMPLEADOS EN CONFLICTO".
- Cuerpo: "Con este horario, {N} empleado(s) quedarían en dos catálogos al mismo tiempo: {lista de nombres}. ¿Qué querés hacer?"
- Botón primario: AJUSTAR HORARIO (volver al sheet de programación).
- Botón secundario: QUITAR EMPLEADOS DE OTROS CATÁLOGOS (resolver desasignando del otro).
- Botón terciario: Cancelar.

Notifs post-resolución:
- "{Nombre} desasignada de "{Catálogo}"."
- "Horario ajustado. Sin conflictos."

Voseo aplicado consistentemente (querés, asignás, podés). Sin emojis. Mayúsculas + letterSpacing para títulos y botones primarios. Nombres entre comillas para distinguir.

---

## Changes

### src/utils/employeeConflicts.js (NUEVO)

Exportar función pura detectEmployeeConflicts(modes):
- Recibe array de modes.
- Devuelve array de conflicts con shape { workerId, modeIdA, modeIdB, day, startMin, endMin }.
- Algoritmo: construir workerId → modes mapping. Por cada worker con 2+ modes, pairwise: usar detectScheduleOverlap de modeScheduling para cada par de activations. Recolectar overlaps con el workerId.
- modeIdA y modeIdB consistentes en orden (modeIdA es el primero en aparecer en el array de modes).
- Si dos overlaps son idénticos pero detectados por dos pares opuestos, deduplicar.

### src/utils/conflictHelpers.js (NUEVO)

Helpers puros consumidos por modal y calendario:
- getConflictDescription(conflict, modes, workers) → { workerName, modeAName, modeBName, dayLabel, timeRange }.
- computeAvatarsInCell(activations, modes, workers, day, startMin, endMin) → array { workerId, initial, avatarColor, textColor } + count "+N" si > 3.
- hasConflictInCell(conflicts, day, startMin, endMin) → boolean.

### src/components/EmployeeConflictModal.js (NUEVO)

Componente controlled. Props: visible, onClose, conflict, modes, workers, mode (newAssignment | newSchedule). Renderiza el modal según el microcopy validado arriba. Backdrop con Pressable + StyleSheet.absoluteFill (regla polish phase). Botones con confirmBtn style del proyecto.

onResolve(action, data) — callback que recibe la acción elegida.

### src/components/WeekCalendarView.js

Agregar avatares en cada banda:
- En el SVG, dentro de cada rect de banda, renderizar SvgCircle + SvgText para cada avatar (max 3). Si hay más, agregar circle con "+N".
- Avatares respetan Owner avatar treatment (theme.accent para owner, worker.color para otros).
- Si hasConflictInCell devuelve true para la celda, borde 2px theme.danger en el rect + ícono alert-triangle pequeño esquina superior derecha.

### src/screens/CatalogDetailScreen.js

Tab Equipo:
- Después de agregar empleado: recalcular detectEmployeeConflicts. Si el array contiene conflicts involucrando el empleado recién agregado, abrir EmployeeConflictModal con mode 'newAssignment'.
- Resolución 'remove-from-new': remover el empleado de assignedWorkerIds del catálogo actual.
- Resolución 'remove-from-existing': remover el empleado del otro catálogo (modeIdA o modeIdB que NO sea el actual).
- Resolución 'cancel': revertir la adición.

Tab Horario:
- Después de guardar nuevo horario vía ScheduleSheet: recalcular detectEmployeeConflicts. Si hay conflicts nuevos (no existían antes del guardado), abrir EmployeeConflictModal con mode 'newSchedule'.
- Resolución 'adjust-schedule': eliminar el horario recién guardado y reabrir ScheduleSheet en modo edit.
- Resolución 'remove-from-other': quitar los empleados conflictivos de los otros catálogos.
- Resolución 'cancel': revertir el horario recién agregado.

### Tests (AAA)

__tests__/unit/employeeConflicts.test.js (NUEVO) — ~20 tests:
- modes vacío devuelve vacío.
- 1 mode con 1 worker devuelve vacío.
- 2 modes con workers distintos sin overlap devuelve vacío.
- 2 modes con mismo worker pero scheduledActivations vacías devuelve vacío.
- 2 modes con mismo worker overlap mismo día devuelve 1 conflict.
- 2 modes con mismo worker overlap parcial devuelve conflict con franja exacta.
- 2 modes con mismo worker sin overlap (días distintos) devuelve vacío.
- 3 modes con mismo worker overlap en pares múltiples devuelve conflicts pairwise.
- Cross-día: Mode A worker X Mier 23-Jue 03, Mode B worker X Jue 02-06 devuelve 1 conflict Jue 02-03.
- Mode A workers [X,Y], Mode B workers [X,Z], overlap devuelve 1 conflict (solo X).
- Mode A workers [X,Y], Mode B workers [X,Y], overlap devuelve 2 conflicts (X y Y).
- Worker en 3+ modes simultáneos devuelve conflicts pairwise.
- mode.isDefault no recibe trato especial.
- Boundaries: Mode A termina 15:00, Mode B empieza 15:00 → SIN conflict (boundary exclusiva).
- Dedup: dos pares opuestos del mismo overlap NO duplican.

__tests__/unit/conflictHelpers.test.js (NUEVO) — ~6 tests:
- getConflictDescription con conflict válido devuelve shape esperado.
- computeAvatarsInCell con <3 workers devuelve array sin "+N".
- computeAvatarsInCell con >3 workers devuelve max 3 + "+N".
- hasConflictInCell con conflict en rango devuelve true.
- hasConflictInCell sin conflict devuelve false.
- hasConflictInCell con conflict en boundary exclusiva devuelve false.

__tests__/unit/weekCalendarView.test.js (actualizar) — +3 tests:
- computeBandPositions con avatares incluye datos de avatars en cada banda.
- Banda con hasConflict tiene borderColor theme.danger.
- Banda sin workers tiene avatars vacío.

Total esperado: +29 tests. De 857 a ~886.

### CLAUDE.md

En "Established Architecture Patterns" agregar bullet nuevo después de "Catalog UI components":

- Employee-catalog conflict detection: declarative system in src/utils/employeeConflicts.js. detectEmployeeConflicts(modes) is a pure function. Helpers in src/utils/conflictHelpers.js for description, avatar computation, and cell conflict check. EmployeeConflictModal.js renders the resolution UI with three options (remove from new, remove from existing, cancel). Visualization in WeekCalendarView shows avatars in cells with red border on conflicts. Conflicts are computed runtime, never persisted. Granularidad per catalog, not per time slot.

En "Process Rules — Learned from Retros" no agregar reglas nuevas — este PR no introduce ninguna nueva regla de proceso.

---

## Rules

- Sin instalar dependencias nuevas.
- Sin migración del schema.
- Conflicts NO se persisten — runtime only.
- Granularidad por catálogo. Si el owner quiere finer, ajusta horarios.
- Polish phase patterns mandatorios (Pressable + StyleSheet.absoluteFill backdrop, sin Alert.alert, sin Dimensions.get).
- Microcopy en voseo según el design:ux-copy.
- One PR = one purpose: este PR es solo el design doc. La implementación viene en el siguiente PR de execution.

---

## Verification

- npm test pasa con 0 fallos, incluyendo los nuevos suites.
- En device como owner:
  - Asignar empleado a un catálogo. Asignar el mismo empleado a otro con horario cruzado. Modal aparece con texto correcto.
  - Confirmar "QUITAR DE catálogo nuevo" — empleado vuelve a no estar en el catálogo nuevo. Notif correcta.
  - Confirmar "QUITAR DE catálogo existente" — empleado se quita del viejo, queda en el nuevo. Notif correcta.
  - Programar horario que cruce con asignaciones existentes — modal aparece. Confirmar "AJUSTAR HORARIO" reabre el sheet en modo edit.
  - En WeekCalendarView: cada banda muestra avatares de empleados. Bandas con conflict tienen borde rojo + ícono alert-triangle.

- grep -rn "detectEmployeeConflicts" src/ debe aparecer en utils, CatalogDetailScreen, y los tests.

---

## Future Work

- Resolución por franja (no solo por catálogo): si el owner quiere granularidad finer (María en Almuerzo solo Lun-Mier, no Jue-Vie), introducir asignaciones con franjas. Decisión cuando haya feedback del mercado.
- Auto-resolución sugerida: cuando hay conflict, el sistema sugiere qué hacer basado en heurísticas (ej. priorizar el catálogo con horario más viejo). Mejora UX si hay muchos conflicts.
- Histórico de conflicts resueltos: para auditoría. Solo si Qentas lo requiere para reportes.
