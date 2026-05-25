# Feature Retro: Co-admin Permissions Matrix

- **Date:** 2026-05-23
- **PR:** feature/co-admin-permissions
- **Design doc:** docs/architecture_design/co_admin_permissions_matrix.md

## Resumen

Sistema declarativo de permisos centralizado en src/utils/permissions.js con 18 acciones. Función pura can(worker, action) + hook useCan(action). Cinco screens restringidas: ProfileScreen oculta items admin para co-admin, BusinessConfigScreen muestra empty state "SOLO PARA EL DUEÑO", ManageModesScreen y ModeEditorScreen entran en modo read-only con badge "CONSULTA", SalesScreen recibe TODO comment para futuro histórico.

## Cambios

- **src/utils/permissions.js** (nuevo) — PERMISSIONS con 18 acciones para owner (todas true) y co-admin (7 operativas true, resto implícitamente false). can(worker, action) retorna boolean.
- **src/hooks/useCan.js** (nuevo) — Hook que consume useAuth y expone can(currentWorker, action).
- **src/screens/ProfileScreen.js** — Sección ADMINISTRACIÓN condicionada con canEditConfig y canViewCatalogs. Co-admin ve "Catálogos" con subtexto "Consultar catálogos activos" pero no "Configuración de cobro". Si ningún item visible, header no se renderiza.
- **src/screens/BusinessConfigScreen.js** — Empty state defensivo al inicio del render: ícono lock, "SOLO PARA EL DUEÑO", botón "VOLVER AL PERFIL".
- **src/screens/ManageModesScreen.js** — Badge "CONSULTA" cuando canEdit es false. Botones de crear/editar/clonar/eliminar condicionados.
- **src/screens/ModeEditorScreen.js** — Botón "GUARDAR CAMBIOS" condicionado. Badge "CONSULTA" cuando canEdit es false.
- **src/screens/SalesScreen.js** — TODO comment para futuro date picker histórico con useCan.
- **__tests__/unit/permissions.test.js** (nuevo) — 24 tests: edge cases (null, undefined, invalid role, empty action), owner perms (4), co-admin permitted (6), co-admin restricted security-critical (5), worker (1), matrix integrity (2).
- **CLAUDE.md** — 825 tests, 56 suites. Co-admin permissions pattern + process rule + priorities actualizadas.

## Qué funcionó

- permissions.js como CJS module con module.exports funciona directamente en jest sin configuración extra — los tests importan con require() y pasan sin mocking.
- El hook useCan es un one-liner que elimina boilerplate en cada screen. Sin él, cada screen haría const { currentWorker } = useAuth(); const canX = can(currentWorker, 'x').
- ProfileScreen tenía la estructura correcta para agregar condiciones — el bloque `{iAmAdmin && (...)}` se adaptó naturalmente a `{iAmAdmin && (canEditConfig || canViewCatalogs) && (...)}`.
- El empty state de BusinessConfigScreen siguió el patrón visual del modal ELIMINAR EMPLEADO — misma familia visual sin inventar nada.

## Lecciones

- La matriz del design doc decía 17 acciones pero al enumerarlas una por una resultaron 18. La diferencia era un agrupamiento textual vs las keys reales. El test de integridad (`PERMISSIONS contains exactly 18 unique action keys`) es un snapshot guard que previene deleciones accidentales.
- ManageModesScreen ya tenía un check `canManageModesLocally(currentWorker)` que retornaba un empty state para non-owners. Pero ese check es más restrictivo que el nuevo: el co-admin PUEDE ver catálogos (view-catalogs: true) pero NO puede editarlos. El check viejo bloqueaba completamente al co-admin. Ahora el co-admin pasa ese check (es admin) pero los controles de edición se filtran con useCan('edit-catalogs').
- El test `can() does not mutate PERMISSIONS` es trivial pero importante: si alguien en el futuro agrega lógica que muta el objeto compartido (como delete de keys), el test lo atrapa.
- El primer intento del conditional en ProfileScreen para el catálogos row era demasiado complejo con tres branches. Lo simplifiqué a: siempre mostrar el row de catálogos si canViewCatalogs, cambiar solo el subtexto según canEditCatalogs.

## Segundo commit — read-only completo en ModeEditorScreen

El primer commit ocultó el botón GUARDAR CAMBIOS con `{canEdit && ...}` pero dejó todos los TextInputs y TouchableOpacity de acciones interactuables. El co-admin veía el badge CONSULTA pero los inputs invitaban a editar — contradicción visible detectada en code-review pre-merge.

El fix usa un wrapper View con `pointerEvents={canEdit ? 'auto' : 'none'}` y `opacity: canEdit ? 1 : 0.55` que envuelve TODO el contenido editable dentro del ScrollView. Esto bloquea toda interacción interna en un solo paso sin necesidad de agregar `editable={false}` a cada TextInput individual ni `disabled` a cada TouchableOpacity. La ScrollView misma queda fuera del wrapper para que el scroll siga funcionando. El botón GUARDAR CAMBIOS también queda fuera del wrapper (ya condicionado con canEdit).

La opacity 0.55 es un feedback visual limpio: el co-admin entiende inmediatamente que el contenido está deshabilitado sin necesidad de microcopy adicional. El patrón pointerEvents='none' es nativo de React Native y no introduce dependencias.

La ejecución fue directa — abrir el View wrapper antes del primer ThemedTextInput, cerrarlo antes del botón GUARDAR. Sin iteración necesaria.
