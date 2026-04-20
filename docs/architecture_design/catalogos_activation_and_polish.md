# Architecture Design: Catálogos — Activation Rework & Polish

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-20
- Target branch: docs/catalogos-activation-polish-design
- Execution branches (2): fix/catalogos-auto-activation, feature/catalogos-product-editor

---

## Problem

Tres problemas pendientes del feature Catálogos que se mergeó con trabajo incompleto:

1. **Botón "Activar" sin sentido conceptual.** El modelo mental correcto es: cada empleado tiene un catálogo asignado que se activa automáticamente al hacer login. El botón manual "Activar" en ManageModesScreen contradice esto — fuerza al owner a activar catálogos a mano cuando debería ser automático por worker. Además, si se quita el botón sin implementar la auto-activación, no hay forma de cambiar de catálogo.

2. **Avatar del owner se ve blanco.** En ProfileScreen, cuando un worker no tiene color asignado (currentWorker.color es null/undefined), el fallback es theme.accent. En tema claro, theme.accent es un color claro, haciendo el avatar invisible contra el fondo. Hay 3 ocurrencias: líneas 124, 269, 342 de ProfileScreen.js.

3. **Product editor modal incompleto.** El modal de edición de producto en ModeEditorScreen (long-press) solo tiene: nombre, precios por tamaño, ingredientes como texto plano, extras con precio. Comparado con AddProductScreen le falta: awareness de tipo (simple vs elaborado), colores de ingredientes con cycling y long-press palette (INGREDIENT_COLORS), icon picker por ingrediente (FOOD_ICONS + MaterialCommunityIcons), colores de extras con cycling, image mode (ícono con color/ícono picker O foto con cámara/galería), max ingredientes por pedido. El editor debe ser una réplica fiel de AddProductScreen adaptada a contexto modal.

---

## Solution

### PR 1 — fix/catalogos-auto-activation

Implementar auto-activación de catálogo por worker assignment y eliminar el mecanismo manual.

**Lógica de auto-activación:**
- En AppContext, crear función autoActivateForWorker(workerId): busca en modes cuál tiene ese workerId en assignedWorkerIds. Si lo encuentra, llama setCurrentMode con ese modeId. Si no encuentra ninguno, activa el mode con isDefault: true (Principal).
- AppContext ya tiene acceso a currentWorker via useAuth(). Agregar un useEffect que observe currentWorker: cuando cambia y no es null, llamar autoActivateForWorker(currentWorker.id).
- El owner también se asigna a un catálogo: en ModeEditorScreen, la sección EMPLEADOS ya permite asignar workers incluyendo al owner. No hay cambio aquí, solo funciona porque el owner también es un worker con id.
- Eliminar el botón "Activar" de ManageModesScreen, la función handleActivate, y la modal de confirmación de tipo 'activate'.
- El currentModeId sigue persistido en AsyncStorage para que al reabrir la app sin re-login se mantenga el último catálogo activo.

**Fix avatar color:**
- En ProfileScreen.js, cambiar las 3 ocurrencias de fallback theme.accent a '#1C1C1E' en los avatares de workers sin color asignado.

**Cambios por archivo:**

- src/context/AppContext.js — nueva función autoActivateForWorker(workerId): busca en modes el que tenga workerId en assignedWorkerIds, si encuentra llama setCurrentMode(modeId), si no encuentra activa el isDefault. Agregar useEffect que observe currentWorker (de useAuth) y llame autoActivateForWorker cuando cambie y no sea null. Exportar autoActivateForWorker en el value del provider.
- src/screens/ManageModesScreen.js — eliminar botón "Activar" del cardActions, eliminar handleActivate, eliminar la modal de confirmación de tipo 'activate' (mantener solo la de 'delete'), limpiar el estado showConfirm para que solo maneje tipo 'delete'.
- src/screens/ProfileScreen.js — cambiar 3 fallbacks de color de avatar de theme.accent a '#1C1C1E'.
- src/utils/modeManagement.js — nueva función pura findModeForWorker(modes, workerId): retorna el mode que tiene workerId en assignedWorkerIds, o el mode con isDefault: true si no encuentra, o null si modes está vacío. AppContext la usa internamente.

**Tests:**

- __tests__/unit/modes/modeAutoActivation.test.js (~10 tests AAA): findModeForWorker con worker asignado retorna su catálogo; worker sin asignación retorna el default; worker con múltiples asignaciones retorna el primero encontrado; workerId null retorna default; modes vacío retorna null; mode sin assignedWorkerIds array retorna default; default mode sin isDefault retorna null; worker asignado a mode sin isDefault retorna ese mode.

---

### PR 2 — feature/catalogos-product-editor

Reescribir el modal de edición de producto en ModeEditorScreen para replicar la calidad de AddProductScreen.

**Extracción de constantes compartidas:**
- Crear src/constants/productConstants.js exportando FOOD_ICONS, CARD_COLORS, INGREDIENT_COLORS, ICON_COLS, ICON_BTN_SIZE.
- Actualizar AddProductScreen.js para importar desde productConstants.js en vez de definirlas localmente. Verificar que funciona exactamente igual.

**El modal de edición debe tener:**

- Awareness de tipo: si editingProduct.type === 'elaborado', mostrar secciones de ingredientes y extras. Si es 'simple', solo nombre, imagen y precios.
- Nombre: TextInput con maxLength 30.
- Image mode: toggle Ícono/Foto.
  - Ícono: preview con color de fondo, picker de color (CARD_COLORS via Modal nativo), picker de ícono (FOOD_ICONS via BottomSheetModal).
  - Foto: cámara/galería via expo-image-picker, preview con botón eliminar.
- Tamaños/precios: lista editable con add/remove.
- Ingredientes (solo elaborado): card con color cycling (tap), long-press palette (INGREDIENT_COLORS via Modal nativo), icon picker (FOOD_ICONS via BottomSheetModal), nombre, remove. Max por pedido input.
- Extras (solo elaborado): card con color cycling, long-press palette, nombre, precio con prefijo $, remove.

**Cambios por archivo:**

- src/constants/productConstants.js (nuevo) — exporta FOOD_ICONS, CARD_COLORS, INGREDIENT_COLORS, ICON_COLS, ICON_BTN_SIZE.
- src/screens/AddProductScreen.js — eliminar constantes locales FOOD_ICONS, CARD_COLORS, INGREDIENT_COLORS, ICON_COLS, ICON_BTN_SIZE. Importar desde productConstants.js. Sin cambios visuales.
- src/screens/ModeEditorScreen.js — importar constantes desde productConstants.js, importar BottomSheetModal, importar ImagePicker, importar MaterialCommunityIcons. Agregar estados para el editor: editImageMode, editSelectedIcon, editIconBgColor, editProductPhoto, editMaxIngredients, paletteTarget, showPalette, showEditIconPicker, showEditIngredientIconPicker, iconTarget. Implementar handlers: pickPhoto, takePhoto, cycleIngredientColor, cycleExtraColor. Reescribir el CenterModal de editingProduct replicando la estructura visual de AddProductScreen dentro del modal. handleSaveProduct actualizado para persistir todos los campos: iconName, iconBgColor, customImage, imageMode, ingredients con color e icon, extras con color, maxIngredients.

**Tests:**

- __tests__/unit/modes/modeProductEditorLogic.test.js (~12 tests AAA): nueva utilidad pura src/utils/productEditorLogic.js con funciones: buildEditedProduct(original, edits) que merge los campos editados respetando el tipo, cycleColor(currentColor, colorArray) que retorna el siguiente color en el array, validateEditedProduct(product) que valida nombre no vacío y al menos un precio. Tests cubren: buildEditedProduct preserva campos no editados; tipo simple excluye ingredientes/extras del resultado; cycleColor wrappea al inicio del array; cycleColor con color no encontrado retorna el primero; validateEditedProduct rechaza nombre vacío; validateEditedProduct rechaza sin precios; buildEditedProduct con imageMode icon incluye iconName e iconBgColor; buildEditedProduct con imageMode photo incluye customImage.

---

## Rules

- UI en español, código/commits en inglés.
- Tests AAA obligatorios. Act llama funciones reales de src/.
- CLAUDE.md se actualiza en cada PR con conteo de tests y suites nuevas.
- El catálogo maestro de productos es la fuente de verdad — el editor modifica el producto real (updateProduct), no solo el override del catálogo.
- Las constantes de producto se comparten en src/constants/productConstants.js, no se duplican.
- Sin @testing-library/react-native.
- Sin Co-Authored-By ni Generated with Claude Code.
- Cada PR trae su propio retro en docs/feature_retros/.
- Para los pickers dentro del modal de edición: usar Modal nativo de React Native para paletas de color, BottomSheetModal para icon grids. No anidar CenterModals.
- Todo cambio que toque lógica de rol incluye grep -r "role ===" src/ en la descripción del PR.

---

## Verification

### PR 1 — Auto-activation
1. npm test — 0 fallos, tests nuevos de auto-activación pasan.
2. Manual: crear worker, asignarle catálogo "Festival" en el editor. Logout. Login como ese worker → catálogo activo cambia a "Festival" automáticamente sin ningún botón.
3. Manual: login como worker sin asignación → catálogo activo es "Principal" (default).
4. Manual: ManageModesScreen ya no tiene botón "Activar" ni modal de confirmación de activación.
5. Manual: avatar del owner en ProfileScreen se ve con color oscuro, no blanco.
6. grep -r "handleActivate\|type: 'activate'" src/ debe devolver 0 matches.

### PR 2 — Product editor
1. npm test — 0 fallos, tests nuevos pasan.
2. Manual: en ModeEditorScreen, long-press un producto elaborado → modal muestra: nombre, image mode toggle, ingredientes con colores/iconos, extras con colores/precios, max ingredientes.
3. Manual: long-press un producto simple → modal muestra: nombre, image mode toggle, precios. NO muestra ingredientes ni extras.
4. Manual: en el modal, cambiar ícono y color de un ingrediente → guardar → producto actualizado refleja los cambios en toda la app (HomeScreen, OrderBuilder, etc).
5. Manual: AddProductScreen sigue funcionando exactamente igual después de mover las constantes al archivo compartido.
6. grep -rn "const FOOD_ICONS\|const CARD_COLORS\|const INGREDIENT_COLORS" src/ debe devolver matches solo en src/constants/productConstants.js.
