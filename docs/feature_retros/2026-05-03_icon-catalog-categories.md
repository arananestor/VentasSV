# Feature Retro: Icon Catalog Categories + Unified Picker

- **Date:** 2026-05-03
- **PR:** refactor/icon-catalog-categories
- **Design doc:** docs/architecture_design/add_product_redesign.md

## Resumen

Reorganización del array plano FOOD_ICONS a un catálogo por categorías (ICON_CATALOG) con 11 categorías, 224 íconos verificados, y función searchIcons(query). Creación de IconColorPicker — componente modal unificado que reemplaza los dos pickers separados (color + ícono) en AddProductScreen y ModeEditorScreen. El picker muestra preview en tiempo real, colores horizontales, buscador, y grid por categorías.

## Cambios

- **src/constants/productConstants.js** — ICON_CATALOG: array de { category, icons[] } con 11 categorías. FOOD_ICONS redefinido como alias flat. searchIcons(query) para filtrado parcial case-insensitive.
- **src/components/IconColorPicker.js** (nuevo) — Modal unificado con: preview del ícono+color en tiempo real, fila horizontal de CARD_COLORS con selección inmediata, barra de búsqueda con searchIcons, grid de íconos por categoría con headers, botón "Listo" para confirmar.
- **src/screens/AddProductScreen.js** — Eliminados estados showColorPicker y showIconPicker, reemplazados por showIconColorPicker. Eliminados los dos pickerRow ("Color de fondo" y "Elegir ícono"). iconPreviewWrap convertido a TouchableOpacity que abre IconColorPicker. Eliminados Modal de COLOR FONDO PRODUCTO y BottomSheetModal de ICON PICKER producto. Icon picker de ingrediente actualizado a grid por categorías. Estilos huérfanos eliminados (pickerRow, pickerRowText, colorDot). Import de FlatList eliminado.
- **src/screens/ModeEditorScreen.js** — Eliminados estados showEditColorPicker y showEditIconPicker, reemplazados por showEditIconColorPicker. Los dos botones separados (Color + Ícono) reemplazados por preview touchable. Modal de color picker y BottomSheetModal de product icon picker reemplazados por IconColorPicker. Icon picker de ingrediente actualizado a grid por categorías. Import de FlatList eliminado, FOOD_ICONS reemplazado por ICON_CATALOG.
- **__tests__/unit/iconCatalog.test.js** (nuevo) — 17 tests para catálogo, alias, y búsqueda.
- **CLAUDE.md** — 760 tests, 52 suites, suite iconCatalog agregada.

## Qué funcionó

- Verificación de cada ícono contra el glyphmap JSON evitó 6 nombres inexistentes
- FOOD_ICONS como alias via flatMap mantiene compatibilidad (ya no se usa en screens pero existe para otros consumidores)
- IconColorPicker con estado local (icon, color) permite cambiar ambos sin cerrar el modal — UX muy superior al flujo anterior de abrir/cerrar dos modales separados
- searchIcons retorna catálogo completo cuando query es vacío — el mismo componente funciona con y sin búsqueda
- Test de duplicados entre categorías detectó tape-measure duplicado

## Lecciones

- Los nombres de íconos de MaterialCommunityIcons no son predecibles — siempre verificar contra el glyphmap
- Unificar color + ícono en un solo modal reduce estados (2 booleanos → 1) y elimina dos modales completos de cada screen
- El patrón de estado local en el picker (setIcon/setColor internos) + confirmación con onSelect al presionar "Listo" evita actualizaciones parciales en el padre
