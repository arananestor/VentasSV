# Architecture Design: Catálogos — UX Fixes & Scheduling Polish

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-21
- Target branch: docs/catalogos-ux-fixes-design
- Execution branch: fix/catalogos-ux-fixes

---

## Problem

Seis problemas de UX encontrados después del merge de los PRs de catálogos:

1. **CenterModal no scrollea.** El TouchableWithoutFeedback interno (línea 14 de CenterModal.js) intercepta todos los gestos de touch incluyendo scroll. Esto rompe: el scroll del contenido del modal cuando es largo (editor de producto), las ruedas del TimeWheelPicker, y cualquier ScrollView anidado dentro de un CenterModal. Es el bug raíz de varios reportes.

2. **Avatar del owner invisible en dark mode.** El círculo del owner es #1C1C1E (almacenado en data) y el texto usa theme.accentText. En dark mode, accentText es #000000 (negro). Negro sobre casi-negro es invisible. En light mode funciona bien (negro sobre blanco). Los workers no tienen este problema porque sus colores del array (#FF6B6B, #4ECDC4, etc.) contrastan bien en ambos modos.

3. **Badge "Activo" obsoleto.** ManageModesScreen muestra un badge verde "Activo" y un borde izquierdo verde en el catálogo activo. Esto era para el botón "Activar" manual que ya se eliminó. La activación ahora es automática por worker. El badge confunde al usuario al implicar que hay que activar manualmente.

4. **Programación sin horario opcional.** Actualmente la programación siempre muestra opciones de hora de inicio y fin por separado. El comportamiento correcto: por defecto los días seleccionados duran el día completo. Si el usuario quiere personalizar, toca un botón opcional que muestra las ruedas de hora inicio + hora fin. Al terminar la última fecha del rango, vuelve al catálogo default.

5. **Precios cortados en el modal de producto.** Los campos de precio en el editor de producto del ModeEditorScreen tienen ancho insuficiente y los números se cortan visualmente.

6. **No hay forma de activar un catálogo indefinidamente.** Con la eliminación del botón "Activar", el owner no tiene forma de decir "quiero que este catálogo esté activo permanentemente hasta que yo lo cambie". Esta opción debe estar integrada donde se asignan los empleados en ModeEditorScreen, manteniendo la armonía visual (SwipeRow, mismos gestos que ya usamos).

---

## Solution

### 1. CenterModal scroll fix

En src/components/CenterModal.js, reemplazar el TouchableWithoutFeedback interno (línea 14) por un View con onStartShouldSetResponder={() => true}. Esto bloquea la propagación del tap al overlay (para que no cierre el modal) pero NO intercepta gestos de scroll. El ScrollView interno ya tiene nestedScrollEnabled y keyboardShouldPersistTaps.

### 2. Avatar del owner theme-aware

En src/screens/ProfileScreen.js, para las 3 ocurrencias del avatar del owner (líneas ~124, ~269, ~342): detectar si el worker es el owner (role === 'owner'). Si es owner, usar theme.accent como backgroundColor y theme.accentText como color de texto. En light mode: accent=#000000 (negro), accentText=#FFFFFF (blanco). En dark mode: accent=#FFFFFF (blanco), accentText=#000000 (negro). Se invierte automáticamente. Workers mantienen sus colores propios con texto blanco (theme.accentText para el top profile avatar, inline { color: theme.accentText } para EQUIPO).

Línea ~124 (profile card top): `backgroundColor: currentWorker?.role === 'owner' ? theme.accent : (currentWorker?.color || '#1C1C1E')`
Línea ~269 (EQUIPO list): `backgroundColor: worker.role === 'owner' ? theme.accent : (worker.color || '#1C1C1E')`
Línea ~342 (detail modal): `backgroundColor: currentWorker?.role === 'owner' ? theme.accent : (currentWorker?.color || '#1C1C1E')`

El texto ya usa theme.accentText en los 3 puntos, así que automáticamente contrasta.

### 3. Quitar badge "Activo" y borde verde

En src/screens/ManageModesScreen.js:
- Eliminar el bloque del badge "Activo" (líneas ~110-113).
- Eliminar el estilo condicional del borde izquierdo verde (línea ~100: `isActive && { borderLeftWidth: 4, borderLeftColor: theme.success }`).
- Mantener el badge "Default" porque sí tiene significado: indica cuál es el catálogo al que el sistema vuelve cuando no hay asignación de worker.

### 4. Programación con horario opcional

En ModeEditorScreen.js, en el CenterModal de programación:
- Al abrir, el default es día completo. Mostrar el calendario para seleccionar fechas.
- Debajo del resumen de fechas, mostrar un botón "Personalizar horario" (ícono clock + texto, mismo estilo que los botones existentes).
- Si el usuario toca "Personalizar horario", aparecen las dos ruedas: "DESDE" con TimeWheelPicker de hora inicio, "HASTA" con TimeWheelPicker de hora fin.
- Si el usuario NO toca el botón, la activación es día completo (startsAt = inicio del primer día, endsAt = fin del último día).
- Eliminar los botones separados "Agregar hora de inicio" y "Agregar hora de fin" actuales. Simplificar a un solo toggle que muestra ambas ruedas juntas.
- El resumen muestra: "Vie 24 - Dom 26 Abr" si es día completo, o "Vie 24 - Dom 26 Abr, 8:00 AM - 5:00 PM" si tiene horario personalizado.

### 5. Precios con ancho suficiente

En ModeEditorScreen.js, en el modal de editar producto: los campos de precio deben tener ancho mínimo de 90px (actualmente el width: 70 del extra price es muy angosto). Revisar todos los TextInput de precio en el modal y asegurar que muestren el número completo. Usar el mismo patrón de AddProductScreen: priceField con width: 100.

### 6. Activar catálogo indefinidamente desde el editor

En ModeEditorScreen.js, agregar una sección justo encima de EMPLEADOS: "CATÁLOGO ACTIVO". Es una sola fila con SwipeRow (mismo componente que ya usamos para productos y workers). Texto: "Activo en este dispositivo". Al swipear, se activa este catálogo como currentModeId (llama setCurrentMode). El dot verde indica si está activo, el fondo del swipe muestra "Activar" / "Desactivar" igual que los productos.

Esto reemplaza funcionalmente el viejo botón "Activar" de ManageModesScreen pero integrado en el editor donde el owner ya está configurando el catálogo. La activación es indefinida hasta que el owner active otro catálogo o una activación programada lo cambie.

Importar setCurrentMode desde useApp en ModeEditorScreen.

---

## Cambios por archivo

- src/components/CenterModal.js — reemplazar TouchableWithoutFeedback interno por View con onStartShouldSetResponder.
- src/screens/ProfileScreen.js — avatar del owner usa theme.accent/theme.accentText según role.
- src/screens/ManageModesScreen.js — eliminar badge "Activo" y borde verde izquierdo.
- src/screens/ModeEditorScreen.js — nueva sección "CATÁLOGO ACTIVO" con SwipeRow, programación con horario opcional (un solo toggle "Personalizar horario" que muestra ambas ruedas), precios con ancho corregido.

---

## Rules

- UI en español, código/commits en inglés.
- Tests AAA obligatorios.
- CLAUDE.md se actualiza si cambian tests o suites.
- Mantener la armonía visual: SwipeRow para activar catálogo usa exactamente el mismo patrón que productos y workers.
- Sin @testing-library/react-native.
- Sin Co-Authored-By ni Generated with Claude Code.
- Retro después del merge.

---

## Verification

1. npm test — 0 fallos.
2. Manual: abrir cualquier CenterModal con contenido largo → el contenido scrollea tocando en cualquier parte, no solo en elementos interactivos.
3. Manual: en ModeEditorScreen, abrir programación → las ruedas del TimeWheelPicker giran correctamente.
4. Manual: programar activación sin personalizar horario → se guarda como día completo.
5. Manual: programar activación con horario personalizado → se guardan hora inicio y hora fin.
6. Manual: en ModeEditorScreen, swipear "Activo en este dispositivo" → el catálogo se activa como currentModeId.
7. Manual: dark mode → avatar del owner es círculo blanco con letra negra. Light mode → círculo negro con letra blanca.
8. Manual: ManageModesScreen → no hay badge "Activo" ni borde verde.
9. Manual: en modal de producto, precios se ven completos sin cortarse.
