# Feature Retro: Extract SimpleProductSheet

- **Date:** 2026-04-28
- **PR:** refactor/extract-simple-product-sheet
- **Design doc:** docs/architecture_design/pos_screen_redesign.md

## Resumen

Extracción del modal de producto simple de POSScreen.js a un componente standalone SimpleProductSheet.js. La lógica interna del modal (sizeQuantities, adjustSize, simpleTotal, simpleHasItems, handleConfirm) se movió dentro del componente — no pertenecía al POS. Overlay cambiado de TouchableOpacity a Pressable + absoluteFill. POSScreen pasa de 382 a 254 líneas (~128 líneas menos). También se limpiaron etiquetas internas ("PR 1a/1b/1c/1d", "sub-PR") del design doc y retros anteriores.

## Cambios

- **src/components/SimpleProductSheet.js** (nuevo) — Props: visible, onClose, product, currentMode, onAddToCart, theme. Contiene toda la lógica de sizeQuantities con useEffect para reinicializar al cambiar product. Usa Pressable + absoluteFill para backdrop. 18 estilos migrados y renombrados sin prefijo "simple".
- **src/screens/POSScreen.js** — Modal inline y toda la lógica del producto simple eliminados. Import de Modal eliminado (ya no se usa). Estado sizeQuantities eliminado. handleSimpleConfirm, adjustSize, simpleTotal, simpleHasItems eliminados. Init de sizeQuantities en handleProductTap eliminado (ahora lo hace useEffect en SimpleProductSheet).
- **docs/architecture_design/pos_screen_redesign.md** — Todas las etiquetas internas reemplazadas por nombres de branch.
- **docs/feature_retros/2026-04-27_pos-remove-edit-mode.md** — Eliminada etiqueta interna.
- **docs/feature_retros/2026-04-28_extract-cart-sheet.md** — Eliminada etiqueta interna.

## Qué funcionó

- Mover la lógica de estado dentro del componente simplifica significativamente POSScreen — no solo se quita JSX, se quitan funciones y estado completo
- useEffect en product para reinicializar sizeQuantities es más limpio que el init manual en handleProductTap — centraliza la responsabilidad
- La limpieza de etiquetas internas en docs fue un buen momento: el PR ya tocaba docs, así que el scope estaba alineado

## Lecciones

- Cuando se extrae un componente que tiene estado interno, verificar que la inicialización del estado se maneje correctamente al cambiar props (en este caso, product cambia → sizeQuantities debe resetearse)
- La eliminación de Modal import de react-native fue posible porque ambos modales (CartSheet y SimpleProductSheet) ahora importan Modal internamente
