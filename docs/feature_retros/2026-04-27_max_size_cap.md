# Feature Retro: Max Size Caps on Scalable Elements

- **Date:** 2026-04-27
- **PR:** fix/max-size-cap-elements

## Resumen

Todos los elementos que escalaban proporcionalmente al ancho ahora tienen un tamaño máximo fijo. En pantallas anchas caben más columnas, no elementos más grandes.

## Cambios

- **useResponsive.js** — MAX_CARD_WIDTH = 220. gridCardSize capped con Math.min(rawCardSize, MAX_CARD_WIDTH).
- **productConstants.js** — MAX_ICON_BTN = 56. getIconBtnSize capped con Math.min.
- **responsive.test.js** — 5 tests nuevos: gridCardSize never exceeds cap, capped on medium width, uncapped on phone, icon btn capped on wide, icon btn uncapped on phone.
- **CLAUDE.md** — 727 tests, nueva regla de global impact analysis.

## Lecciones

- El principio correcto para responsive es: más columnas, no elementos más grandes. El cap forzado garantiza que cards e íconos nunca se vean desproporcionados.
- La regla de global impact analysis evita crashes como el ICON_BTN_SIZE que se perdió en un StyleSheet estático.
