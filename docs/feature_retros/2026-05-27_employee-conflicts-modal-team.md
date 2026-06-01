# Feature Retro: Employee Conflicts Modal + Team Tab Integration

- **Date:** 2026-05-27
- **PR:** feature/employee-conflicts-modal-and-team (PR #92)
- **Design doc:** docs/architecture_design/employee_catalog_conflicts.md

## Resumen

Modal de conflicto para asignación de empleados + integración en Tab Equipo de CatalogDetailScreen. Cuando el owner asigna un empleado a un catálogo y ese empleado ya tiene horario cruzado con otro catálogo, el modal previene el error mostrando tres opciones de resolución. Refactor de conflictHelpers para usar isOwner boolean en lugar de colores hardcoded.

## Cambios

- **src/utils/conflictHelpers.js** — computeAvatarsInCell: shape de avatar cambiado de { avatarColor, textColor } a { isOwner: boolean }. El componente consumer aplica colores según theme.
- **__tests__/unit/conflictHelpers.test.js** — +1 test: isOwner true para owner, false para worker.
- **src/components/EmployeeConflictModal.js** (nuevo) — CenterModal con ícono alert-circle danger, título "{NOMBRE} YA TIENE HORARIO", cuerpo con nombre del catálogo existente y franja conflictiva, 3 botones: QUITAR DE nuevo / QUITAR DE existente / Cancelar. Microcopy del design doc aplicado exacto.
- **src/screens/CatalogDetailScreen.js** — Tab Equipo: addWorkerToMode simula la asignación antes de persistir, detecta conflicts con detectEmployeeConflicts, abre EmployeeConflictModal si hay conflict. Resoluciones: 'remove-from-new' (no persiste, notif), 'remove-from-existing' (persiste en actual + desasigna del otro, notif), 'cancel' (cierra sin cambios).
- **CLAUDE.md** — 882 tests. CLAUDE.md pattern updated: modal implemented for newAssignment variant.

## Qué funcionó

- La simulación pre-persist fue la decisión correcta: crear un simulatedMode con el worker agregado, construir simulatedModes sustituyendo el mode actual, y correr detectEmployeeConflicts sobre esos modes simulados. Si hay conflict, NO se persiste nada — el modal resuelve primero. Esto evita rollback complejo (persistir + detectar + revertir si hay conflict).
- EmployeeConflictModal determina "currentModeName" vs "otherModeName" automáticamente comparando conflict.modeIdA/B con currentModeId. El texto del modal se adapta sin lógica extra.
- La resolución 'remove-from-existing' ejecuta dos updateMode en secuencia (agregar al actual + remover del otro). Funciona porque updateMode es idempotente y cada call persiste independientemente.

## Lecciones

- El split en #92 (modal + Tab Equipo) y #93 (calendar avatars + Tab Horario) fue correcto. El modal sola con Tab Equipo es una unidad cohesiva testeable en device. Los avatares en calendario y la variante newSchedule son scope separado con complejidad visual propia.
- El refactor de isOwner (code review issue del PR #91) fue 1 línea de cambio en el helper + 1 test nuevo. Los colores hardcoded eran un smell — el helper es una función pura que no debería conocer el theme. El componente consumer tiene acceso al theme y puede aplicar colores según isOwner.
- La variante 'newSchedule' del modal (para Tab Horario) quedó diferida a PR #93. El EmployeeConflictModal acepta mode prop pero solo 'newAssignment' está implementado. 'newSchedule' requiere microcopy distinto y lógica de rollback de horario — scope del siguiente PR.
