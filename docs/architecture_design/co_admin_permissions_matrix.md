# Architecture Design: Co-admin Permissions Matrix

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-05-23
- Target branch: feature/co-admin-permissions

---

## Revision Notes

- 2026-05-23 (during PR #80 execution): view-catalogs removed from co-admin default permissions. Decision made after recognizing that catalog access for co-admin should be tied to the upcoming catalog system redesign and a per-worker override layer. The action remains in the matrix for owner; the read-only infrastructure (badge CONSULTA, pointerEvents wrapper in ModeEditorScreen) stays in code as available infrastructure for the future per-worker override implementation. See docs/feature_retros/2026-05-23_co-admin-permissions.md for context.

---

## Problem

VentasSV define tres roles: owner, co-admin, worker. El worker se filtra por puesto. Pero el co-admin actualmente tiene acceso EQUIVALENTE al owner — ve los mismos tabs, accede a Configuración de cobro, edita catálogos, en el futuro vería históricos y gestión de empleados.

Esta paridad es incorrecta para el caso salvadoreño. El co-admin existe como operario-de-confianza-delegado (cónyuge, hijo mayor, hermano que opera cuando el dueño no está). NO debe ver datos sensibles: márgenes, históricos financieros, configuración bancaria, gestión de empleados. Hoy dar acceso de co-admin equivale a dar acceso completo, lo que desincentiva al dueño a usar el rol.

## Solution

Sistema declarativo de permisos centralizado en src/utils/permissions.js. Una constante PERMISSIONS define qué acciones puede hacer cada rol. Una función pura can(worker, action) consulta la matriz. Un hook useCan(action) envuelve can() con AuthContext. Cada pantalla restringida invoca useCan('action-name') y filtra UI o muestra empty state.

El co-admin recibe permisos operativos completos (POS, comandas, ventas del día, cuadrar día, compartir resumen, catálogos en consulta read-only). NO recibe permisos administrativos (editar configuración, editar catálogos, toggle owner mode, históricos, dashboard) ni gestión sensible de empleados.

---

## Alternatives Considered

### Opción A — Matriz declarativa centralizada (elegida)

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Media |
| Costo | Cero deps |
| Escalabilidad | Alta — agregar roles/acciones es 1 línea |
| Familiaridad del equipo | Media — patrón nuevo en el repo |

Pros: single source of truth, auditable en un archivo, testeable como función pura, patrón Stripe/Auth0, extensible a futuros roles sin refactor.
Contras: indirección extra, nuevos PRs deben recordar consultar can().

### Opción B — Helpers semánticos en roleConfig.js

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Baja |
| Costo | Cero |
| Escalabilidad | Baja — helpers crecen sin control |
| Familiaridad del equipo | Alta — similar a getTabsForWorker |

Pros: explícito en cada screen.
Contras: docenas de helpers con el tiempo, no se ve la matriz completa de un vistazo.

### Opción C — Checks inline en cada screen

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Baja inicialmente |
| Escalabilidad | Muy baja |

Pros: cero arquitectura nueva.
Contras: viola reglas del repo (Bug fix global scan, Global impact analysis). Anti-pattern.

### Opción D — RBAC completo con grupos y jerarquías

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Alta |
| Escalabilidad | Excelente |

Contras: overkill para 3 roles. Violación YAGNI.

---

## Trade-off Analysis

Opción A es el balance correcto entre arquitectura y simplicidad. Cuando se habiliten roles de empleado (cocinero/motorista/camarero), se agregan entradas a la matriz, no helpers nuevos. La función can(worker, action) ya soporta todos los roles desde el día uno.

Elección: A.

---

## Matriz inicial — 17 acciones

Operativas (co-admin SÍ, owner SÍ):
- use-pos
- view-orders
- view-day-sales
- share-shift-summary
- close-cash-register (placeholder, feature futura)
- view-catalogs (consulta read-only)

Administrativas (solo owner):
- edit-business-config
- edit-catalogs
- toggle-owner-mode
- view-historical-sales
- export-historical-csv (placeholder)
- view-owner-dashboard (placeholder)

Equipo — info básica (co-admin SÍ cuando se habilite la sección):
- view-employee-basic-info (nombre, foto, DUI, PIN, puesto)

Equipo — sensible (solo owner, futuro):
- view-employee-sensitive-data
- create-employee
- edit-employee
- delete-employee
- change-employee-role

---

## Consequences

Becomes easier:
- Auditar permisos en un archivo
- Agregar roles o acciones nuevas con 1 línea
- Testear con función pura
- Refactorizar localmente

Becomes harder:
- Cada feature nueva debe registrar su acción en la matriz y consultar can()
- Onboarding cognitivo de nuevos contribuidores (mitigado por doc en CLAUDE.md)

To revisit:
- Cuando se habiliten roles de empleado, decidir si la matriz necesita una sección por puesto o si los puestos siguen filtrándose por tabs.
- Si en el futuro el owner quiere "autorizar al co-admin específicamente para use-pos" o no, agregar capa de overrides por worker individual.

---

## Changes

### src/utils/permissions.js (NUEVO)

Exportar:
- PERMISSIONS: objeto con claves por role ('owner', 'co-admin'), cada uno con objeto de acciones booleanas. La matriz inicial cubre las 17 acciones listadas arriba. owner tiene true en todas. co-admin tiene true en use-pos, view-orders, view-day-sales, share-shift-summary, close-cash-register, view-catalogs, view-employee-basic-info. Resto de acciones para co-admin: false (o ausentes del objeto, que se interpreta como false).
- can(worker, action): función pura que recibe worker y string action. Si worker es null o sin role, retorna false. Si action no existe en la matriz del role, retorna false. Si la matriz devuelve true, retorna true.

### src/hooks/useCan.js (NUEVO)

Hook que consume useAuth y devuelve can(currentWorker, action). Útil para componentes que no quieren llamar can() manualmente con currentWorker.

### src/screens/ProfileScreen.js

- Items "Configuración de cobro" y "Catálogos (edit)" en la sección admin: condicionar render con useCan('edit-business-config') y useCan('edit-catalogs') respectivamente. Si false, no se renderiza el item.
- Si la sección admin queda completamente vacía para el rol actual (caso co-admin que no tiene ninguno de los items), no renderizar el header "ADMINISTRACIÓN" tampoco. Evita header huérfano.

### src/screens/BusinessConfigScreen.js

Defensive: al inicio del render, si useCan('edit-business-config') es false, mostrar empty state restrictivo en lugar del contenido normal.

Estructura del empty state (siguiendo el patrón del modal ELIMINAR EMPLEADO de ProfileScreen):
- Wrapper centrado con padding.
- Ícono Feather "lock" tamaño 24 en círculo con confirmIconWrap-style background theme.bg.
- Título estilo confirmTitle: "SOLO PARA EL DUEÑO"
- Subtítulo estilo confirmSub: "Esta sección es privada del dueño. Volvé a tu perfil para seguir trabajando."
- Botón estilo confirmBtn con backgroundColor theme.accent y texto "VOLVER AL PERFIL", al tocarlo navigation.popToTop() o navigation.navigate('ProfileMain').

### src/screens/ManageModesScreen.js

Vista read-only para co-admin: condicionar todos los controles de edición (botones de crear catálogo, editar, eliminar, agregar producto al catálogo, programar activación) con useCan('edit-catalogs'). Si false, esos elementos NO se renderizan.

Agregar un badge "CONSULTA" pequeño junto al título principal de la pantalla (o cerca del header) cuando useCan('edit-catalogs') es false. Estilo: similar a otros badges del proyecto (mayúsculas, letterSpacing 2, fontSize 10, padding chico, borderRadius 6, background theme.bg, color theme.textMuted).

La lista de catálogos sigue mostrándose. El co-admin puede tocar cada catálogo para ver su contenido. Dentro del editor de catálogo (ModeEditorScreen si aplica), también condicionar los controles de edición igual.

### src/screens/SalesScreen.js

Preparación para futuro histórico:
- El export CSV del día sigue disponible para co-admin (usa share-shift-summary, que tiene true).
- Cualquier UI futura de date picker histórico o export histórico debe condicionarse con useCan('view-historical-sales') y useCan('export-historical-csv').
- Por ahora la pantalla solo muestra "VENTAS HOY" — no requiere cambios visibles en este PR, pero el comentario inline en el código debe documentar que el futuro histórico se condicionará con useCan.

### src/screens/ModeEditorScreen.js

Si la pantalla recibe modeId y permite editar, condicionar los inputs de edición y el botón "Guardar" con useCan('edit-catalogs'). Si false, mostrar solo lectura de los campos sin permitir editar, con badge "CONSULTA" arriba.

### __tests__/unit/permissions.test.js (NUEVO)

AAA pattern obligatorio. Tests cubren cada combinación (rol, acción) crítica:
- can(null, 'use-pos') es false.
- can(worker sin role, 'use-pos') es false.
- can(owner, 'use-pos') es true.
- can(owner, 'edit-business-config') es true.
- can(owner, 'view-historical-sales') es true.
- can(owner, 'edit-catalogs') es true.
- can(co-admin, 'use-pos') es true.
- can(co-admin, 'view-orders') es true.
- can(co-admin, 'share-shift-summary') es true.
- can(co-admin, 'view-catalogs') es true.
- can(co-admin, 'edit-business-config') es false.
- can(co-admin, 'edit-catalogs') es false.
- can(co-admin, 'toggle-owner-mode') es false.
- can(co-admin, 'view-historical-sales') es false.
- can(co-admin, 'create-employee') es false.
- can(co-admin, 'view-employee-basic-info') es true.
- can(worker, 'use-pos') es false (workers se filtran por puesto, no por matriz de permisos).
- can(owner, 'accion-inexistente') es false.

### CLAUDE.md

Agregar en "Established Architecture Patterns" un bullet nuevo después de "Owner work mode":

- Co-admin permissions matrix: declarative system in src/utils/permissions.js. PERMISSIONS constant maps role to allowed actions. can(worker, action) is a pure function. useCan(action) is the React hook consuming AuthContext. Each restricted screen uses useCan to filter UI or show defensive empty states. Co-admin has full operational permissions (POS, orders, day sales, shift sharing, catalog read-only) and zero administrative permissions (business config, edit catalogs, owner mode toggle, historical data, employee sensitive data). Pattern documented in docs/architecture_design/co_admin_permissions_matrix.md.

Agregar al final de "Process Rules — Learned from Retros":

- New restricted features must register their action in the permissions matrix: When introducing a feature that should be restricted by role (financial data, configuration, employee management, etc.), the action must be added to src/utils/permissions.js with explicit role assignments, and the consuming screen must invoke useCan(action). Adding a feature without registering its permission means defaulting to "everyone sees it" — the inverse of secure-by-default. (Source: PR #79 co-admin permissions matrix design)

Actualizar Active priorities: el item "Co-admin permissions matrix" (#4) lo movemos a Completed milestones cuando se mergee el execution PR #80. En este design doc solo lo proponemos.

---

## Rules

- Sin instalar dependencias nuevas.
- Sin migración formal de storage. El campo role del worker ya existe y no cambia.
- Sin tocar lógica de owner — el owner sigue teniendo todo igual.
- can() es función pura — no consume hooks, no tiene side effects.
- useCan() es el hook que consume useAuth; can() se puede usar directo fuera de componentes (en tests, utilities).
- One PR = one purpose: este PR define la matriz. El execution implementa.
- Microcopy de empty states restrictivos: "SOLO PARA EL DUEÑO" como título, "Esta sección es privada del dueño. Volvé a tu perfil para seguir trabajando." como cuerpo, "VOLVER AL PERFIL" como botón. Badge "CONSULTA" donde aplique. Voseo aplicado.
- Polish phase patterns aplican (Pressable + StyleSheet.absoluteFill en cualquier modal si aparece, sin Alert.alert, sin Dimensions.get estático).

---

## Verification

- npm test pasa con 0 fallos, incluyendo el suite nuevo permissions.test.js.
- En device, logueado como owner: TODO sigue funcionando igual que antes — sin regresión.
- En device, logueado como co-admin (crear uno manualmente en setup o cambiar role temporalmente para testing):
  - Tabs visibles: Venta, Comandas, Ventas, Perfil (los 4).
  - En Perfil, sección ADMINISTRACIÓN ya no muestra "Configuración de cobro" ni "Catálogos" como item editable.
  - Si tiene acceso a "Catálogos" en algún path (por ejemplo desde otro lado), entra a ManageModes y ve el badge "CONSULTA", sin botones de crear/editar/eliminar.
  - Las ventas del día se ven, el botón export CSV del día funciona.
  - El resumen de turno se comparte correctamente.

- grep -rn "useCan\|can(" src/screens/ encuentra las invocaciones en ProfileScreen, BusinessConfigScreen, ManageModesScreen, ModeEditorScreen.
- grep -n "Co-admin permissions matrix" CLAUDE.md devuelve el bullet nuevo.

---

## Future Work

- Información sensible de empleados (salario, contratos, datos personales) cuando se habilite la sección EQUIPO: nueva acción view-employee-sensitive-data solo para owner. La lista basic-info (nombre, foto, DUI, PIN, puesto) sigue siendo accesible al co-admin.
- Autorización opcional del owner para que el co-admin pueda o no usar POS, comandas, etc. Hoy use-pos es true por default para co-admin; si el dueño quiere quitarle ese permiso a un co-admin específico, requeriría una capa de overrides por worker individual encima de la matriz por role.
- Owner Dashboard (Active priority #7) usará view-owner-dashboard cuando se construya.
- Cash register close (Active priority #8) ya tiene close-cash-register reservado en la matriz como true para owner y co-admin.
