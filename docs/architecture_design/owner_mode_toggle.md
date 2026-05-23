# Architecture Design: Owner Mode Toggle (Operativo vs Administrativo)

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-05-21
- Target branch: feature/owner-mode-toggle

---

## Problem

VentasSV opera con un solo modo de UI para el owner: ve todos los tabs (Venta, Comandas, Ventas, Perfil) y todas las secciones administrativas (Configuración de cobro, Catálogos). Esta uniformidad no refleja los dos perfiles reales del mercado salvadoreño:

1. Owner-operativo: el dueño que trabaja en su propio negocio — atiende caja, prepara comida, gestiona pedidos. Es el caso del 80% de los negocios chicos en El Salvador (pupuserías, ventas de comida, kioscos, farmacias familiares). Necesita las herramientas operativas más las administrativas.

2. Owner-administrativo: el dueño que delega operación y se concentra en configurar, gestionar catálogos, revisar números. Es el caso del dueño que escaló y tiene empleados estables. No quiere ruido de tabs operativas que no usa.

Hoy ambos perfiles ven la misma UI. El owner-administrativo tiene fricción visual; el owner-operativo no tiene una afirmación de su rol. Y la arquitectura no permite que el owner "se comporte como" otros roles de empleado a medida que se vayan habilitando (Cocinero/Comandas, Motorista/Entregas, Camarero/Mesas).

## Decision

Agregar un campo ownerMode al worker owner que tome los valores operativo o administrativo, persistido en AsyncStorage como parte del worker object. Default operativo al login si no existe. El owner cambia su modo desde un switch en ProfileScreen con confirmación obligatoria. roleConfig.getAllowedTabs(worker) consulta el ownerMode para filtrar los tabs visibles. Operativo es superset de administrativo: ve todo lo administrativo más todas las herramientas operativas, e incluirá automáticamente las futuras pantallas de empleado a medida que se habiliten.

El co-admin no recibe toggle en esta primera versión y se trata como siempre operativo. La matriz de permisos de co-admin se decide en PR separado (ver Future Work).

---

## Alternatives Considered

Cuatro opciones se evaluaron antes de elegir la decisión arriba. La tabla compara las dimensiones clave.

### Opción A — Modo persistente en worker.ownerMode + toggle en Perfil (elegida)

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Baja |
| Costo | Cero dependencias nuevas |
| Escalabilidad | Alta — el patrón se extiende a co-admin si se decide |
| Familiaridad del equipo | Alta — mismo patrón que role y puesto |

Pros: single source of truth, persistente entre sessions y devices del mismo owner, cambio reversible en un toque, sin pregunta de login para el caso común.
Contras: si el owner-administrativo un día quiere trabajar, debe cambiar el modo manualmente (1 toque consciente, no fricción real).

### Opción B — Modo session-only (pregunta al login)

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Media |
| Costo | Cero dependencias nuevas |
| Escalabilidad | Baja — agrega fricción que escala mal |
| Familiaridad del equipo | Alta |

Pros: flexibilidad máxima, cada login elige.
Contras: pregunta en cada login. Para el 80% que es operativo, ruido innecesario. Patrón anti-mobile: las apps profesionales recuerdan el contexto.

### Opción C — Modo persistente con override por sesión

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Alta |
| Costo | Cero |
| Escalabilidad | Baja — modelo mental confuso |
| Familiaridad del equipo | Media |

Pros: lo mejor de A y B en teoría.
Contras: doble state (persistido + session) propenso a bugs, modelo mental confuso ("¿estoy en mi modo o en override?"), overkill para el problema actual.

### Opción D — Modo derivado de deviceType

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Media |
| Costo | Cero |
| Escalabilidad | Baja — acopla dos conceptos distintos |
| Familiaridad del equipo | Media |

Pros: reusa la lógica existente de deviceType (fixed vs personal).
Contras: acopla deviceType (sobre el dispositivo) con ownerMode (sobre el rol del usuario). El owner con teléfono personal puede querer operativo (lo lleva consigo a vender). Decisión rígida que el usuario no controla directamente.

---

## Trade-off Analysis

La decisión clave es persistencia vs sesión. La fricción del modelo session-only (Opción B) es alta — los dueños pequeños abren la app decenas de veces al día; preguntarles el modo cada vez es ruido inaceptable. El modelo persistente (Opción A) refleja la realidad operativa: el dueño de pupusería sabe que él vende, el dueño de cadena sabe que él administra. El modo cambia raramente.

La Opción C agrega complejidad sin caso de uso fuerte. La Opción D acopla conceptos que deben mantenerse ortogonales — deviceType resuelve un problema distinto (logout a SelectWorker vs directo).

Elección: Opción A.

---

## Consequences

Becomes easier:
- El owner administrativo ve solo lo que le importa — menos ruido, decisiones más rápidas.
- Cuando se habiliten otros roles de empleado, el owner operativo automáticamente accede a todos.
- Onboarding futuro puede preguntar el modo durante setup inicial y persistirlo desde el primer login.

Becomes harder:
- Cualquier feature nueva tiene que considerar: ¿es operativa, administrativa, o ambas? Pero esa pregunta es saludable, no técnica.
- El testing crece: cada flow nuevo del owner se prueba en ambos modos.

To revisit:
- Cuando se habiliten co-admin como rol con su propia matriz de permisos (PR de Co-admin permissions matrix), decidir si co-admin también tiene modos.
- Si en el futuro queremos "override del día" (caso edge), agregamos Opción C encima sin migración.

---

## Changes

### src/context/AuthContext.js

Agregar campo ownerMode al worker object cuando el role es owner.

Comportamiento:
- En setupOwner, el worker se crea con ownerMode operativo.
- En loginWithPin, si el worker es owner y no tiene ownerMode definido (workers pre-PR), tratarlo como operativo sin escribir nada hasta que el owner cambie el modo manualmente. Sin migración silenciosa.
- Exponer setOwnerMode(mode) en el value del provider. Recibe operativo o administrativo. Valida que currentWorker es owner. Actualiza el worker en el array workers en memoria, persiste en AsyncStorage, y actualiza currentWorker para reflejo inmediato.
- El campo ownerMode persistente; los siguientes logins del owner leen el valor guardado.

Sin migración formal del schema.

### src/utils/roleConfig.js

Modificar getAllowedTabs(worker) para considerar ownerMode cuando role es owner.

Lógica:
- Owner + administrativo: solo tabs administrativos (por ahora Perfil; futuro Dashboard).
- Owner + operativo (o ausente, default): ALL_TABS sin cambio respecto al comportamiento actual.
- Co-admin: ALL_TABS sin cambios en este PR.
- Worker: sin cambios, filtra por puesto.

Exportar constante ADMIN_ONLY_TABS para que sea explícito qué tabs son administrativos.

### src/navigation/AppNavigator.js

Confirmar que el cambio de ownerMode propaga reactivamente al navegador. Si no propaga, agregar la dependencia explícita al re-render trigger.

### src/screens/ProfileScreen.js

Agregar sección "MODO DE TRABAJO" en la zona admin de ProfileScreen, visible solo si currentWorker.role === 'owner'. Posicionar antes de "Configuración de cobro".

Estructura visual:
- Sección con label "MODO DE TRABAJO" en mayúsculas con letterSpacing (mismo estilo de las otras secciones).
- Card con valor grande del modo actual: "Operativo" o "Administrativo".
- Descripción debajo del valor:
  - Si operativo: "Trabajás en el negocio: vendés, atendés y administrás."
  - Si administrativo: "Administrás sin atender ventas."
- Botón outline a la derecha del card con label dinámico:
  - Si modo actual es operativo: "Cambiar a administrativo"
  - Si modo actual es administrativo: "Cambiar a operativo"

Al tocar el botón "Cambiar a ...", abrir CenterModal de confirmación con:
- Título en mayúsculas: "¿CAMBIAR A MODO ADMINISTRATIVO?" o "¿CAMBIAR A MODO OPERATIVO?" según destino.
- Cuerpo según destino:
  - A administrativo: "Vas a ocultar Venta y Comandas. Podés volver a operativo cuando quieras desde tu perfil."
  - A operativo: "Vas a habilitar Venta y Comandas. Podés volver a administrativo cuando quieras desde tu perfil."
- Botón primario con backgroundColor theme.accent: "CAMBIAR A ADMINISTRATIVO" o "CAMBIAR A OPERATIVO" según destino. Ejecuta setOwnerMode y cierra modal.
- Botón secundario en texto plano: "Cancelar".

Backdrop con Pressable + StyleSheet.absoluteFill.

### CLAUDE.md

Agregar en "Established Architecture Patterns" un bullet nuevo después de "Owner avatar treatment":

- Owner work mode: when worker.role === 'owner', the field ownerMode ('operativo' or 'administrativo') controls visible tabs via getAllowedTabs in src/utils/roleConfig.js. Operativo is a superset of administrativo (administrative tabs + operational tabs + future role-specific tabs). Administrativo shows only administrative tabs (currently only Profile; future Owner Dashboard joins this set). Default is operativo. Workers without the field are treated as operativo (no formal migration). Toggle exposed in ProfileScreen with mandatory confirmation modal.

Agregar al mismo bloque otro bullet nuevo después del de Photo picker:

- Skills mapping (architect orchestration): the architect invokes specialized skills according to this table at the corresponding phase. engineering:architecture for design docs of features with real architectural decisions (schema, auth, navigation, data models). design:ux-copy when the design doc defines on-screen text (labels, errors, descriptions, CTAs). engineering:code-review after Code opens the execution PR and before Nestor merges. engineering:testing-strategy when the feature touches critical logic (auth, payments, sensitive data, migrations). engineering:standup for weekly summaries. design:accessibility-review before public beta. engineering:tech-debt every 20-30 PRs.

En "Process Rules — Learned from Retros", agregar al final dos reglas nuevas con el formato bullet con bold del tema:

- Skills orchestration rule: The architect must follow the skills-mapping table in CLAUDE.md (Established Architecture Patterns → Skills mapping) and announce at the top of every instruction block: which skills were invoked, which were evaluated and discarded with reason, and which will be invoked pre-merge. Nestor can audit at any time with "¿qué skills usaste para esto?". Process, not goodwill. (Source: PR #77 architect process formalization)

- Design docs born from ADR include Alternatives Considered: When a design doc is produced after invoking engineering:architecture, the document must include sections "Alternatives Considered" with the options evaluated (table of dimensions per option) and "Trade-off Analysis" with reasoning. The Problem/Solution/Changes/Rules/Verification format of the repo extends — it does not replace — the ADR rigor. Without these sections the ADR is wasted. (Source: PR #77 ADR-to-design-doc preservation)

En "Current Priority — Beta v0.1 → Active priorities", la lista actualizada queda así (renumerando):

1. Release develop → main on PR #74 cycle, every 10 PRs thereafter
2. ProfileScreen fixes — custom shift modal, compact summary, camera vs gallery
3. Owner mode toggle — operativo vs administrativo (base del sistema de roles, operativo es superset de administrativo)
4. Co-admin permissions matrix — define qué ve y qué no ve el co-admin (datos financieros agregados, configuración del negocio, gestión de catálogos, gestión de equipo)
5. Sales date picker + historical CSV export with full columns
6. Verify static map + geo URI flow in SaleDetailScreen
7. Onboarding — solo vs team → configure available tools → lazy loading
8. Owner dashboard — live orders, daily sales, active team
9. Cash register close — for fixed devices on shift change
10. Photo picker global migration — AddProductScreen, PaymentScreen, ModeEditorScreen, BusinessConfigScreen consume PhotoPickerSheet
11. Role-specific screens — motorista (entregas), camarero (mesas)

---

## Rules

- Sin instalar dependencias nuevas.
- Sin migración formal de storage. Workers existentes sin ownerMode se tratan como operativo.
- Sin tocar la lógica de co-admin en este PR — scope del PR Co-admin permissions matrix.
- Confirmación obligatoria al cambiar modo. Backdrop con Pressable + StyleSheet.absoluteFill.
- Sin Alert.alert, sin Dimensions.get('window') estático.
- One PR = one purpose: este PR define el owner mode toggle. La matriz de co-admin va en PR separado.
- Polish phase patterns aplican (showNotif, CenterModal, useResponsive si hay cálculos de ancho).
- Microcopy en español salvadoreño con voseo (vendés, podés, gestionás, atendés). No usar tú.

---

## Verification

- npm test pasa con 0 fallos.
- En device:
  - Login como owner. Tabs operativos visibles (default operativo).
  - Ir a Perfil. Ver "MODO DE TRABAJO" con "Operativo" como valor.
  - Tocar "Cambiar a administrativo". CenterModal aparece con texto correcto. Confirmar.
  - Tabs operativos desaparecen inmediatamente, solo queda Perfil.
  - Tocar "Cambiar a operativo". Volver al estado anterior.
  - Cerrar app, reabrir. El modo guardado se respeta.
- grep -r "Alert.alert" src/ devuelve cero.
- grep -r "Dimensions.get" src/ devuelve cero.
- grep -rn "ownerMode" src/ aparece en AuthContext, roleConfig, ProfileScreen, y los tests.

---

## Future Work

- Co-admin permissions matrix (Active priority #4). Define qué ve y qué no ve el co-admin: NO ve datos financieros agregados (semana/mes/año/histórico), NO accede a configuración de cobro, NO crea ni edita catálogos, NO gestiona empleados ni sus PINs. SÍ vende, ve comandas, ve ventas del día actual, cuadra el día, comparte resúmenes.
- Owner Dashboard como tab administrativo. Cuando se construya, se agrega a ADMIN_ONLY_TABS.
- Onboarding pregunta al owner durante setup si trabaja en el negocio o solo administra, persistiendo el ownerMode desde el primer login.
