# Feature Retro: POSScreen Header Slim

- **Date:** 2026-04-30
- **PR:** fix/pos-header-slim
- **Design doc:** docs/architecture_design/add_product_redesign.md

## Resumen

Reducción del grosor del header colapsable del POSScreen para un layout más compacto estilo Stripe/Toast POS. El header expandido ocupa menos espacio vertical, dejando más room para el grid de productos.

## Cambios

- **src/screens/POSScreen.js** — Header: paddingTop 12→6, paddingBottom 10→4. headerLeft gap 10→8. statusDot 10x10→8x8. workerName fontSize 17→15. modeIndicator: gap 6→5, marginBottom 6→4, paddingHorizontal 10→8, paddingVertical 4→3. modeIndicatorText fontSize 11→10. tabPill: height 40→32, paddingHorizontal 16→12, gap 6→5, borderRadius 20→16. tabPillName fontSize 13→12. tabCount: 20x20→18x18. tabCountText fontSize 10→9.
- **src/utils/collapsibleHeader.js** — TAB_BAR_HEIGHT 48→38, TAB_BAR_MARGIN 6→4.
- **__tests__/unit/collapsibleHeader.test.js** — Assertions actualizadas: TAB_BAR_HEIGHT 48→38, TAB_BAR_MARGIN 6→4.

## Qué funcionó

- Reducción proporcional de todos los valores (no solo uno) mantiene la proporción visual
- Los tab pills a 32px con fontSize 12 se sienten compactos pero siguen siendo targets táctiles válidos (>30px)

## Lecciones

- Al cambiar constantes en utilities, verificar siempre los tests que las referencian — en este caso collapsibleHeader.test.js tenía assertions hardcoded sobre TAB_BAR_HEIGHT y TAB_BAR_MARGIN
