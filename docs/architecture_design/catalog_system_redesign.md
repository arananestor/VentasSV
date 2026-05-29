# Architecture Design: Catalog System Redesign

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-05-23
- Target branch: feature/catalog-redesign

---

## Problem

El módulo de catálogos (modes) sufre de cuatro problemas estructurales:

1. ModeEditorScreen es un frankenstein de 585 líneas que mezcla cuatro responsabilidades: metadata del catálogo, gestión de productos activos/precios, edición DIRECTA de productos (renombrar, ingredientes, sizes), programación temporal y asignación de equipo.

2. Acoplamiento producto/catálogo: editar un producto desde el editor del catálogo afecta a TODOS los catálogos que lo incluyan. Confuso y peligroso.

3. Sin flujo dedicado para asignación de equipo. Sin soporte para múltiples locales (futuro).

4. La programación temporal actual no soporta el caso de uso real de El Salvador: eventos puntuales (cumpleaños, eventos estudiantiles, días festivos) donde el owner programa horarios y NO quiere preocuparse de activar/desactivar manualmente. Tampoco soporta visualización del horario semanal ni resolución clara de conflictos.

VentasSV va a producción como extensión de Qentas, sirviendo a cualquier comerciante salvadoreño (pupuserías, farmacias, talleres, tiendas, kioscos, eventos). El sistema actual no escala a ese ámbito.

## Decision

Rediseñar el módulo en tres ejes simultáneos:

1. **Separación arquitectónica.** Crear src/screens/CatalogDetailScreen.js con cinco tabs internos (Detalles / Productos / Equipo / Locales / Horario). Locales queda oculto hasta que se habilite multi-local. Eliminar src/screens/ModeEditorScreen.js. La edición de productos individuales se delega completamente a AddProductScreen.

2. **Modelo extendido.** Mode gana dos campos: color (string, default theme.accent) para identificación visual, y assignedLocationIds (array, default vacío) para multi-local futuro. scheduledActivations gana opcionalmente locationId. Sin migración formal — campos opcionales con defaults.

3. **Permisos definidos.** edit-catalogs solo owner. assign-catalog nueva acción solo owner (capa de overrides por-worker como Future Work). view-catalogs queda false para co-admin como en PR #80.

## Alternatives Considered

### Opción A — Pantalla única con tabs internos (elegida)

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Media |
| Costo | Cero deps |
| Escalabilidad | Alta — tabs nuevos sin refactor |
| Familiaridad | Media — patrón nuevo en VentasSV pero estándar mobile |

Pros: navegación fluida sin perder contexto, patrón Toast/Square/Stripe, escalable a tabs futuros, single source of truth para gestos.
Contras: requiere componente InternalTabs nuevo, riesgo de pantalla larga si los tabs tienen mucho contenido.

### Opción B — Múltiples sub-pantallas en navigation stack

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Media-alta |
| Costo | Cero |
| Escalabilidad | Alta |
| Familiaridad | Alta — usa React Navigation que ya conocemos |

Pros: reutiliza patrón existente.
Contras: navegación fragmentada, fricción mobile, estado disperso entre pantallas.

### Opción C — Pantalla monolítica refinada (status quo)

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Baja |
| Escalabilidad | Baja |

Contras: no resuelve el frankenstein de 585 líneas.

### Opción D — Drawer lateral

| Dimensión | Evaluación |
|-----------|-----------|
| Familiaridad | Baja |

Contras: web-thinking en mobile portrait. Inadecuado.

## Trade-off Analysis

Opción A vs B es el debate real. La Opción B agrega fricción mobile (cada ida y vuelta entre sub-pantallas es navegación + carga). Opción A mantiene al owner en un solo contexto — los tabs son la metáfora correcta para "facetas del mismo objeto". Toast, Square, Lightspeed lo hacen así. Es lo que el dueño espera de una app POS profesional.

Elección: A.

## Consequences

Becomes easier:
- Owner ve un catálogo en un lugar.
- Edición de productos canónica en AddProductScreen, sin duplicación.
- Agregar tabs futuros (Locales cuando se habilite, Reportes futuros) es un componente.
- Asignación de equipo en dos taps.
- Permisos por-tab triviales con useCan.
- Color visual por catálogo permite identificación inmediata en el calendario.

Becomes harder:
- Refactor inicial invasivo (pantalla nueva, componente de tabs, modelo extendido).
- Tests de modeManagement, modeResolution, modeScheduling requieren adaptación al shape extendido.

To revisit:
- Si los tabs crecen >5, considerar nested navigation dentro de uno.
- Renombrar mode interno a catalog (housekeeping futuro, scope mediano).
- Templates de catálogo (presets opcionales al crear el primero) como segunda iteración.

---

## Estructura de pantallas

ManageModesScreen (lista de catálogos)
- Tap normal → entra a CatalogDetailScreen.
- Swipe derecha completa → duplicar (directo, reversible, notif "Catálogo duplicado como Copia de X").
- Swipe izquierda completa → modal de confirmación "ELIMINAR CATÁLOGO" → ELIMINAR (rojo) / Cancelar.
- Long press → modal de confirmación "ACTIVAR AHORA" → ACTIVAR (theme.accent) / Cancelar. Activa el catálogo inmediatamente como override manual.

CatalogDetailScreen con cinco tabs internos en orden:
1. Detalles — nombre editable, descripción editable, badges informativos (PRINCIPAL si aplica, ACTIVO si es el actual), color picker (12 colores predefinidos en grid + opción "Mi color" con hex), sin botones de activar/duplicar/eliminar (esas son swipe en la lista).
2. Productos — toggle activo/inactivo por producto, link "Editar precio en este catálogo" para override (input que aparece debajo del producto). Empty state si no hay productos creados aún.
3. Equipo — lista de workers asignados con foto+nombre+puesto. Swipe-left en row remueve. Botón AGREGAR EMPLEADO abre sheet con workers disponibles. Empty state si nadie asignado.
4. Locales — oculto hasta multi-local. Cuando se habilite, mismo patrón que Equipo pero para Locations.
5. Horario — calendario semanal visual + lista de horarios programados.

Tab "Horario" — diseño detallado:

- Section label "HORARIO DE ACTIVACIÓN" + sub-texto explicativo en voseo: "Tu catálogo se cambia solo según los eventos que programés. Volvés al Principal automáticamente."
- Calendario semanal SVG: 7 columnas (L M M J V S D) x rango de horas (6am a 12am o ajustable). Bandas horizontales coloreadas con el color del catálogo correspondiente. Solapamientos visibles a la vista (las bandas se cruzan visiblemente).
- Lista de horarios programados debajo. Cada row: barra vertical fina con el color del catálogo + nombre + descripción ("Lun a Vie · 11:00 a 15:00 · Recurrente" o "Sáb 15 nov · 16:00 a 19:00 · Evento"). Swipe-left elimina (irreversible, modal de confirmación).
- Botón outline al final "PROGRAMAR HORARIO" → abre sheet de programación.

Sheet "Programar horario":
- Selector de tipo (toggle): Evento puntual / Recurrente.
- Si Evento: selector de fecha (DatePicker), hora inicio, hora fin.
- Si Recurrente: selector de días de la semana (7 chips toggleables), hora inicio, hora fin.
- Soporte de cross-día: si fin < inicio, el sistema entiende "se extiende al día siguiente".
- Preview vivo: mini-calendario semanal mostrando cómo quedaría el horario superpuesto a los existentes. Si solapa, las bandas se cruzan visiblemente con warning subtle abajo.
- Botón GUARDAR HORARIO.

Resolución de solapamiento (al tocar GUARDAR si hay cruce):
- Modal de confirmación: "El catálogo {nombreNuevo} se cruza con {nombreExistente} el {día/fecha} de {hora} a {hora}. ¿Qué querés hacer?"
- Tres opciones: REEMPLAZAR EN LA FRANJA CRUZADA (el nuevo gana solo en el solape) / AJUSTAR HORARIO (volver al sheet) / CANCELAR (no guardar).
- Cero magia automática. El owner decide.

---

## Catálogo Principal

Concepto: el Principal es el estado base permanente del negocio. Siempre existe, no se puede eliminar, no se puede sacar de la app. Cuando ningún evento está activo, el sistema vende con el Principal. Cuando un evento termina, vuelve al Principal solo.

Badge fijo "PRINCIPAL" reemplaza el actual "POR DEFECTO" (más claro semánticamente).

Banner activo en pantallas operativas (POS, Comandas, Ventas) cuando un catálogo distinto al Principal está activo:
- Si UN solo catálogo activo: banner simple. "VENDIENDO AHORA · {nombre} · Vuelve a Principal en {Xh Ymin}". Tap abre sheet "Cambiar catálogo ahora" con lista de catálogos disponibles.
- Si DOS o más catálogos activos simultáneamente (multi-local futuro): banner colapsado con texto "{N} catálogos activos". Tap en chevron lo expande mostrando cada uno con su countdown.

Cambio manual del Principal:
- Desde la lista de catálogos, long press en un catálogo no-Principal → modal "HACER PRINCIPAL". El anterior queda como catálogo normal.
- Solo puede haber UNO Principal a la vez.

Countdown en el banner se actualiza cada minuto vía setInterval con cleanup, mismo patrón que CompactSummaryBand del PR #76.

---

## Changes

### src/models/mode.js

Agregar al createMode:
- color: string opcional, default theme.accent (literal hex o referencia al theme). Si no se pasa, el sistema asigna theme.accent al crearlo.
- assignedLocationIds: array opcional, default [].

scheduledActivations[].locationId: opcional, default null (catálogo global a todos los locales del owner).

Migración: no formal. Modes pre-PR sin color usan theme.accent al renderizar.

### src/components/InternalTabs.js (NUEVO)

Componente controlled. Props: tabs (array de { key, label }), activeKey, onTabChange. Renderiza una fila horizontal con underline en la tab activa. Scrollable horizontal si los tabs no caben. Estilo armónico con la app (sentence case, fontSize 12-13, borderBottom 2px en activo, color theme.text vs theme.textSecondary).

### src/components/WeekCalendarView.js (NUEVO)

Componente puro de visualización. Props: scheduledActivations (array), modes (array con id, name, color), weekOffset (default 0 para semana actual). Renderiza SVG con:
- Header con días de la semana (L M M J V S D).
- Grid de 7 columnas x rango de horas.
- Bandas absolutas por cada horario programado, coloreadas con mode.color.
- Texto corto dentro de las bandas si el espacio lo permite.
- Cruces visibles cuando hay solapamientos.

### src/components/DayChipsSelector.js (NUEVO)

Componente controlled. 7 chips toggleables (L M M J V S D). Botón "Toda la semana" para seleccionar todos. Botón "Lun a Vie" para selección rápida.

### src/components/CatalogActiveBanner.js (NUEVO)

Componente que consume currentMode, modes, principalMode del AppContext. Renderiza:
- Nada si el currentMode es el Principal.
- Banner simple si UN catálogo no-Principal está activo. Color de fondo: success-tinted. Texto + countdown. Tap abre sheet.
- Banner colapsado expandible si dos o más catálogos activos (multi-local futuro).

Countdown se calcula del scheduledActivation.end del mode activo. setInterval cada 60 segundos con cleanup en unmount + AppState listener para refresh al volver foreground.

### src/components/CatalogColorPicker.js (NUEVO)

Componente controlled. Props: value, onChange. Renderiza grid de 12 colores predefinidos del palette del proyecto (variantes de teal, coral, blue, amber, purple, green, gray, pink, red) + opción "Mi color" que abre input para hex custom.

### src/screens/CatalogDetailScreen.js (NUEVO)

Pantalla que consume route.params.modeId. Header con nombre del catálogo. InternalTabs con 5 tabs (Locales oculto si feature multi-local no habilitado). Cada tab es un componente interno renderizado condicionalmente según activeKey.

Tab Detalles:
- Inputs editables: nombre (con validación no-vacío), descripción (multilínea opcional).
- Badges informativos (no botones): PRINCIPAL si isDefault, ACTIVO si currentModeId === mode.id.
- CatalogColorPicker con value mode.color.
- handleSave debounced que actualiza el mode en AppContext y persiste.

Tab Productos:
- Lista de products (de AppContext) con switch activo/inactivo controlado por mode.productOverrides[productId]. Tap en el switch toggle. Link "Editar precio en este catálogo" expande input para override numérico.
- Empty state si products vacío: "Aún no creaste productos. Andá a la pantalla de productos para crear el primero."

Tab Equipo:
- Lista de workers asignados (mode.assignedWorkerIds + lookup en workers).
- Swipe-left en row remueve directo (con notif "{nombre} desasignado del catálogo").
- Botón "AGREGAR EMPLEADO" abre BottomSheetModal con workers no asignados aún. Tap en uno lo asigna.

Tab Locales:
- Renderizar solo si feature flag multi-local habilitado (por ahora hardcoded false).
- Estructura idéntica a Equipo pero para Locations.

Tab Horario:
- WeekCalendarView con scheduledActivations + modes + colores.
- Lista de horarios programados debajo, cada uno con barra de color, descripción, swipe-left elimina (modal de confirmación porque es irreversible).
- Botón outline "PROGRAMAR HORARIO" abre sheet de programación.

### src/screens/ManageModesScreen.js (REFACTOR mayor)

Reemplazar los ActionPills actuales (Editar/Clonar/Eliminar) por gestos en la card:
- Swipe derecha completa → duplicar (directo).
- Swipe izquierda completa → modal "ELIMINAR CATÁLOGO" / Cancelar.
- Long press → modal "ACTIVAR AHORA" / Cancelar (activación manual override).
- Tap normal → navega a CatalogDetailScreen con modeId.

Botón "Crear nuevo catálogo" sigue como está. Por defecto el catálogo nuevo recibe theme.accent como color hasta que el owner lo cambie en Tab Detalles.

### src/screens/POSScreen.js

Renderizar CatalogActiveBanner arriba del header colapsable. Solo aparece si el currentMode no es el Principal. Si aparece, ajustar el spacing del header colapsable para que el banner no se solape.

### src/screens/OrdersScreen.js, src/screens/SalesScreen.js

Mismo CatalogActiveBanner arriba del header. Consistencia entre pantallas operativas.

### src/utils/modeScheduling.js

Extender la lógica para:
- Detectar solapamientos al programar (función pura detectScheduleOverlap(newActivation, existingActivations, modes)).
- Determinar qué mode debería estar activo en un momento dado (getActiveModeAt(now, modes, manualOverride)).
- Soportar cross-día (activación que cruza medianoche).
- Resolver conflictos con prioridad: override manual > evento puntual > recurrente > Principal.

### src/utils/permissions.js

Agregar acción assign-catalog con owner: true, co-admin: false. La matriz queda con 19 acciones registradas.

### src/screens/AppNavigator.js

Registrar CatalogDetailScreen. Deregistrar ModeEditor (eliminar la entrada).

### src/screens/ModeEditorScreen.js

ELIMINAR el archivo. Sin transición, sin deprecación.

### __tests__/unit/ (cambios y nuevos)

- modeScheduling.test.js: agregar tests AAA para detectScheduleOverlap, getActiveModeAt, cross-día, prioridades.
- permissions.test.js: agregar tests para assign-catalog (owner true, co-admin false).
- catalogColorPicker.test.js: NUEVO. Tests de lógica pura (selección, custom hex válido/inválido).
- internalTabs.test.js: NUEVO. Tests de lógica pura (cambio de activeKey, tabs disponibles).
- weekCalendarView.test.js: NUEVO. Tests de lógica pura de posicionamiento (no de SVG render).

Test counts esperados crecen aproximadamente +15-20 tests.

### CLAUDE.md

En "Established Architecture Patterns" agregar:

- Catalog system: src/screens/CatalogDetailScreen.js with five internal tabs (Detalles / Productos / Equipo / Locales / Horario). Tabs component is src/components/InternalTabs.js. Tab "Locales" is hidden until multi-local feature is enabled. Mode model includes color (string) and assignedLocationIds (array) since this PR. ModeEditorScreen was deleted in this PR.
- Catalog active banner: src/components/CatalogActiveBanner.js renders in POSScreen, OrdersScreen, SalesScreen above headers when currentMode is not the Principal. Shows nombre + live countdown until next mode switch. Tap opens sheet to change catalog manually. Multi-catalog active state (multi-local future) collapses to expandable list.
- Week calendar view: src/components/WeekCalendarView.js renders 7-day grid with horizontal colored bands per scheduledActivation, using mode.color. Overlaps visible as crossed bands.

En "Process Rules — Learned from Retros" agregar:

- Modal confirmation only for irreversible actions: User actions that cannot be undone (delete, replace, change to permanent state) require an explicit confirmation modal with the action button labeled with the action verb (DELETE, REPLACE, ACTIVATE). Reversible actions (duplicate, toggle, sort) execute directly without modal — the user undoes by performing the inverse action if needed. This applies across all screens and components. (Source: PR #81 catalog redesign design)

En "Current Priority — Beta v0.1 → Active priorities" mover el item de Catalog redesign al top dado que es el módulo en construcción ahora. Renumerar.

---

## Rules

- Sin instalar dependencias nuevas.
- Sin migración formal del schema. Modes pre-PR sin color usan theme.accent; sin assignedLocationIds usan array vacío.
- Sin tocar lógica de owner — el owner sigue siendo el único con edit-catalogs y assign-catalog por default.
- Polish phase patterns aplican (Pressable + StyleSheet.absoluteFill en modales, sin Alert.alert, sin Dimensions.get estático, animaciones solo transform/opacity con useNativeDriver true).
- One PR = one purpose: este PR es el design doc. Execution viene después.
- Microcopy en voseo aplicado consistentemente (vendés, programés, activá, tocá, andá).
- Banner activo y countdown DEBEN actualizarse al volver foreground (AppState listener).
- Swipe gestures siguen el patrón Spotify: la barra de progreso del swipe muestra el ícono+color de la acción; al soltar antes de completar se cancela; al completar el swipe la acción se ejecuta (directo si reversible, con modal si irreversible).

---

## Verification

- npm test pasa con 0 fallos.
- En device como owner:
  - Lista de catálogos: swipe derecha duplica, swipe izquierda abre modal de confirmar eliminar, long press abre modal de activar manualmente, tap entra al detalle.
  - CatalogDetailScreen: los 5 tabs cambian contenido sin salir de la pantalla. Locales no aparece.
  - Tab Detalles: cambiar color con CatalogColorPicker se refleja en la lista y el calendario.
  - Tab Horario: programar un horario nuevo. Si solapa, modal explícito. Resolver y guardar. Calendario muestra la banda.
  - POSScreen: si hay un catálogo no-Principal activo por horario, banner verde aparece arriba con countdown. Si el evento termina (puede simularse adelantando el reloj o esperando), banner desaparece y vuelve al Principal solo.
  - Long press en un catálogo no-Principal en la lista activa manualmente. Banner aparece con countdown del fin del evento programado o "manual" si no tiene fin.
- ModeEditorScreen no existe más.
- grep -r "Alert.alert" src/ devuelve cero.
- grep -r "Dimensions.get" src/ devuelve cero.

---

## Future Work

- Multi-local: habilitar tab Locales, crear modelo Location, integrar con scheduledActivations.locationId.
- Templates opcionales al crear el primer catálogo (Horario normal, Promoción, Evento especial, Fin de semana) — segunda iteración.
- Override por-worker para que el owner permita assign-catalog a un co-admin específico.
- Renombrar mode interno a catalog en código (housekeeping, scope mediano).
- Tab "Reportes del catálogo" con ventas filtradas por mode.
- AddProductScreen modo edit completo si todavía no lo está (verificar en el execution PR).
