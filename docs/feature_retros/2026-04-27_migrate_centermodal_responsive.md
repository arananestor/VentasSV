# Feature Retro: Migrate CenterModal and productConstants to Dynamic Dimensions

- **Date:** 2026-04-27
- **PR:** refactor/migrate-centermodal-responsive

## Resumen

Eliminados los últimos Dimensions.get('window') estáticos en src/components/ y src/constants/. CenterModal usa useWindowDimensions para MAX_H dinámico. productConstants exporta getIconBtnSize(width) en vez de ICON_BTN_SIZE estático.

## Cambios

- **CenterModal.js** — Dimensions removido, useWindowDimensions calcula maxH dinámicamente en cada render.
- **productConstants.js** — Dimensions removido, ICON_BTN_SIZE reemplazado por getIconBtnSize(screenWidth). FOOD_ICONS/CARD_COLORS/INGREDIENT_COLORS/ICON_COLS no cambian.
- **AddProductScreen.js** — importa getIconBtnSize, calcula ICON_BTN_SIZE con useWindowDimensions dentro del componente.
- **ModeEditorScreen.js** — misma migración.

## Lecciones

- Exportar funciones que reciben width como parámetro es más flexible que constantes estáticas — permite recalcular al rotar sin re-importar el módulo.
