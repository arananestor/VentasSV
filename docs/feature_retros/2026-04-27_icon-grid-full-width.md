# Feature Retro: Dynamic Icon Grid Columns

- **Date:** 2026-04-27
- **PR:** fix/icon-grid-full-width

## Resumen

Las grillas de íconos ahora calculan columnas dinámicamente según el ancho de pantalla. En landscape y tablet, caben más íconos por fila. ICON_COLS=6 marcado como deprecated.

## Cambios

- **productConstants.js** — getIconCols(screenWidth) calcula columnas dinámicas basado en MAX_ICON_BTN + márgenes. Mínimo 4. getIconBtnSize ahora usa getIconCols internamente.
- **AddProductScreen.js** — importa getIconCols, calcula ICON_COLS_DYN, ambos FlatList usan numColumns={ICON_COLS_DYN} con key={ICON_COLS_DYN}.
- **ModeEditorScreen.js** — misma migración.
- **responsive.test.js** — 4 tests nuevos para getIconCols.
- **CLAUDE.md** — 731 tests, nueva regla de completitud de design doc sections.

## Lecciones

- Cuando se hace dinámico un valor (ICON_BTN_SIZE), todos los valores dependientes (ICON_COLS) deben hacerse dinámicos en el mismo PR. Dejar uno hardcodeado anula el beneficio del otro.
