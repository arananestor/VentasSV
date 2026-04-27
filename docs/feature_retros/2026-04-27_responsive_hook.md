# Feature Retro: useResponsive Hook

- **Date:** 2026-04-27
- **PR:** feat/responsive-hook

## Resumen

Hook useResponsive con cálculos proporcionales al ancho real del dispositivo. Sin breakpoints rígidos para columnas ni tamaños — todo fluye del ancho. Único threshold fijo: isTablet (600dp, clasificación de categoría de dispositivo).

## Cambios

- **src/hooks/useResponsive.js** — hook con useWindowDimensions. Expone: width, height, isTablet, isLandscape, padding, gap, columns, gridCardSize, layout, fontSize. computeResponsive exportada para testing.
- **__tests__/unit/responsive.test.js** — 15 tests cubriendo 6 anchos reales (320-1200), escalado proporcional y mínimos.

## Decisiones

- **Proporcional vs breakpoints**: columnas calculadas con MIN_CARD_WIDTH (155) dividiendo el ancho disponible. Un teléfono de 375px da 2 columnas, uno de 600px da 3, un tablet de 1200px da 5. No hay "si width >= 768 entonces 4 columnas".
- **MIN_CARD_WIDTH = 155**: basado en que las cards actuales se ven bien a ~170px y necesitan al menos ~150px para que el precio y nombre no se corten.
- **computeResponsive exportada**: permite testear sin React hooks. El hook solo agrega useWindowDimensions encima.

## Lecciones

- Los breakpoints rígidos crean edge cases en cada threshold. El cálculo proporcional se adapta a cualquier ancho sin sorpresas.
