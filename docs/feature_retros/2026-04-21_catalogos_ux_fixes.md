# Feature Retro: Catálogos — UX Fixes

- **Date:** 2026-04-21
- **PR:** fix/catalogos-ux-fixes

## Resumen

Seis fixes de UX para catálogos: CenterModal scroll, avatar del owner theme-aware, badge "Activo" eliminado, precios con ancho corregido, activación permanente via SwipeRow.

## Cambios

- **CenterModal.js** — TouchableWithoutFeedback interno reemplazado por View con onStartShouldSetResponder. Esto permite scroll de contenido largo y funcionamiento del TimeWheelPicker.
- **ProfileScreen.js** — Avatar del owner usa theme.accent/theme.accentText (se invierte auto en dark mode). Workers mantienen sus colores propios con texto '#fff'.
- **ManageModesScreen.js** — Badge "Activo" y borde verde izquierdo eliminados. Solo queda badge "Default".
- **ModeEditorScreen.js** — Precios width 80→95 y 60→90. Nueva sección "CATÁLOGO ACTIVO" con SwipeRow para activar permanentemente.

## Qué funcionó

- onStartShouldSetResponder es el fix correcto para bloquear propagación de tap sin interceptar scroll
- theme.accent/theme.accentText como par para el owner resuelve ambos modos sin condicionales de isDark

## Lecciones

- TouchableWithoutFeedback es un anti-patrón dentro de modales con contenido scrolleable — siempre usar View con onStartShouldSetResponder
