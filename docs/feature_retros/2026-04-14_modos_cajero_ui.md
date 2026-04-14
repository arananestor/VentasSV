# Feature Retro: Cashier View Respects Active Mode

- **Date:** 2026-04-14
- **PR:** #37

## Resumen

El cajero ahora ve productos filtrados y precios resueltos según el Modo activo. Las tabs se ordenan según tabOrder del Modo. Un indicador compacto muestra el nombre del Modo activo en HomeScreen.

## Cambios por archivo

- **src/utils/modeResolution.js** — nuevo: `resolveVisibleProducts`, `resolveProductPrice`, `resolveTabOrder`. Funciones puras.
- **src/screens/HomeScreen.js** — productos filtrados por `resolveVisibleProducts`, tabs por `resolveTabOrder`, precios con `resolveProductPrice`. Indicador de Modo (pill). Cleanup de logs [MODOS-F1 VERIFY].
- **src/screens/OrderBuilderScreen.js** — `calcTotal` y selector de sizes usan `resolveProductPrice`.
- **src/context/AppContext.js** — cleanup de logs [MODOS-F1 VERIFY].

## Qué funcionó

- `resolveProductPrice` es lo suficientemente flexible: respeta priceOverride solo en productos de un size (el caso más común en El Salvador: pupusas a precio único).
- El fallback defensivo (mode null → comportamiento legacy) evita romperse si la migración v5 no corrió aún por alguna razón.
- Las tabs mantienen su UX actual — solo se reordenan, no se filtran ni eliminan.

## Qué ajustaríamos

- El indicador de Modo podría ser más visible — hoy es un pill sutil. Evaluaremos en testing con usuarios reales si necesita más prominencia.

## Limitación conocida

- `priceOverride` con productos multi-size (más de un tamaño) queda ignorado en esta iteración. Solo aplica cuando `product.sizes.length === 1`. La UI de gestión de Modos (siguiente PR) podrá ofrecer override por size cuando la necesidad lo justifique.

## Notas para el siguiente PR

- La gestión de Modos del owner aún no existe — los Modos hoy solo se crean vía la migración v5 ("Principal").
- El siguiente PR agrega la pantalla de gestión en ProfileStack: crear, clonar, editar overrides, editar tabOrder, activar, eliminar Modos, y scheduled mode changes locales.
