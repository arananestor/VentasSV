# Feature Retro: Employee-Catalog Conflicts Calendar Visualization

- **Date:** 2026-05-27
- **PR:** feature/employee-conflicts-calendar (PR #93)
- **Design doc:** docs/architecture_design/employee_catalog_conflicts.md

## Resumen

Avatares de empleados y bordes rojos de conflicto en WeekCalendarView. Cada banda del calendario muestra los avatares de empleados asignados al catálogo correspondiente (max 3 + "+N" overflow). Bandas con conflicto de empleados (mismo worker en dos catálogos con horario cruzado) muestran borde 2px rojo + indicador "!" en esquina superior.

## Cambios

- **src/components/WeekCalendarView.js** — Importa detectEmployeeConflicts, computeAvatarsInCell, hasConflictInCell. Acepta prop workers (array). Calcula conflicts una vez por render. Cada banda: renderiza avatares SVG (Circle + initial Text) al fondo si height > 30px. Si hasConflictInCell devuelve true, rect usa stroke theme.danger width 2 + "!" en esquina. Workers lookup por workerId para obtener color (isOwner → theme.accent, otros → worker.color).
- **CLAUDE.md** — Employee conflict detection pattern actualizado con visualización del calendario (PR #93).
- **docs/feature_retros/2026-05-27_employee-conflicts-calendar.md** — este archivo.

## Qué funcionó

- Las constantes AVATAR_R=7 y AVATAR_SPACING=18 dieron avatares compactos que caben dentro de bandas de 30px+ de alto sin solapar el label del nombre del catálogo (que va arriba).
- computeAvatarsInCell retorna isOwner boolean — el componente hace el lookup final de color con workers.find() para no-owners. Esto cumple con el refactor del code review del PR #91 (helper theme-agnostic, componente aplica colores).
- detectEmployeeConflicts se calcula una vez por render (no por banda). Con los volúmenes de VentasSV (<10 modes, <20 workers), la complejidad O(W × M² × A²) es negligible.

## Lecciones

- **PR #92 no está mergeado todavía.** Este branch se basa en develop con PR #91 (foundation). El test count es 881 (no 882 del PR #92 que agrega 1 test de isOwner). Los dos PRs (#92 modal+team y #93 calendar) son independientes y pueden mergearse en cualquier orden sin conflicto — tocan archivos distintos.
- **SVG Circle + Text positioning en react-native-svg** es directo: cx/cy para el circle, x/y para el text con textAnchor="middle". La initial se posiciona cy+3 para centrado visual vertical (SVG text baseline está arriba, no al medio).
- **computeBandPositions ahora incluye startMin/endMin** en cada banda para que el rendering pueda pasarlos a computeAvatarsInCell y hasConflictInCell. Antes solo tenía x/y/width/height (pixels). Los tests de computeBandPositions existentes no verifican estos campos nuevos — no rompieron.
