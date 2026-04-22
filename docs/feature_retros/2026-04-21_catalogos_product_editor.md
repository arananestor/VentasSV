# Feature Retro: Catálogos — Full Product Editor Modal

- **Date:** 2026-04-21
- **PR:** feature/catalogos-product-editor

## Resumen

Product editor modal en ModeEditorScreen reescrito para replicar la calidad de AddProductScreen. Constantes de producto extraídas a archivo compartido. Utilidades puras de edición creadas y testeadas.

## Cambios por archivo

- **src/constants/productConstants.js** (nuevo) — FOOD_ICONS, CARD_COLORS, INGREDIENT_COLORS, ICON_COLS, ICON_BTN_SIZE
- **src/screens/AddProductScreen.js** — importa constantes desde productConstants en vez de definirlas localmente
- **src/utils/productEditorLogic.js** (nuevo) — cycleColor, validateEditedProduct, buildEditedProduct
- **src/screens/ModeEditorScreen.js** — editor modal completo: nombre, image mode toggle (ícono con color picker + icon picker, foto con cámara/galería), tamaños con add/remove, ingredientes con color cycling + long-press palette + icon picker (solo elaborado), extras con color cycling + precio (solo elaborado), max ingredientes. Modals nativos para paletas, BottomSheetModal para icon grids. Worker counter "N de M asignados".
- **CLAUDE.md** — 707 tests, 49 suites, modeProductEditorLogic en lista

## Qué funcionó

- Extraer constantes a productConstants.js fue limpio — un solo import replace en AddProductScreen
- Los pickers (color, icon) fuera del CenterModal evitan el problema de modales anidados
- cycleColor como función pura simplifica el cycling en ingredientes y extras

## Qué ajustaríamos

- El modal es largo con muchas secciones — en pantallas pequeñas puede sentirse apretado. El ScrollView interno del CenterModal mitiga esto pero no es ideal.

## Lecciones

- Constantes compartidas entre screens deben vivir en src/constants/ desde el inicio, no extraerse después.
