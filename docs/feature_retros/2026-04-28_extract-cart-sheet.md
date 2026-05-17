# Feature Retro: Extract CartSheet

- **Date:** 2026-04-28
- **PR:** refactor/extract-cart-sheet
- **Design doc:** docs/architecture_design/pos_screen_redesign.md

## Resumen

Extracción del modal del carrito de POSScreen.js a un componente standalone CartSheet.js. Overlay cambiado de TouchableOpacity anti-patrón a Pressable + StyleSheet.absoluteFill (patrón correcto de CenterModal). POSScreen pasa de 477 a 382 líneas (~95 líneas menos).

## Cambios

- **src/components/CartSheet.js** (nuevo) — Componente que recibe props: visible, onClose, cart, cartTotal, onRemoveItem, onClearCart, onCheckout, theme. Usa Pressable + StyleSheet.absoluteFill como backdrop (no TouchableOpacity). Incluye todos los estilos del carrito migrados y renombrados sin prefijo "cart" (cartItem → item, cartItemName → itemName, etc.).
- **src/screens/POSScreen.js** — Modal del carrito inline reemplazado por `<CartSheet />` con props. 22 estilos del carrito eliminados del StyleSheet. Estado showCart permanece en POSScreen.

## Qué funcionó

- El patrón Pressable + absoluteFill ya estaba probado en CenterModal — aplicarlo al CartSheet fue directo
- Props API limpia: visible, onClose, cart, cartTotal, onRemoveItem, onClearCart, onCheckout, theme
- El callback onClearCart combina clearCart() + setShowCart(false) desde POSScreen para mantener la lógica de cierre en el padre

## Lecciones

- Al extraer componentes con estilos, conviene renombrar los estilos para eliminar el prefijo del contexto original (cartItem → item) ya que dentro del componente el prefijo es redundante
- La verificación con grep post-extracción es clave: confirma que no quedan referencias huérfanas al código movido
