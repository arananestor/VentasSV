# Architecture Design: POSScreen Redesign

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-27
- Target branch: Multiple sub-PRs (1a, 1b, 1c, 1d)

---

## Problem

POSScreen.js tiene 566 líneas haciendo demasiado: renderiza productos, maneja edit mode con delete overlay, usa Alert.alert nativo (viola regla del proyecto), y contiene dos modales inline (CartSheet ~75 líneas, SimpleProductSheet ~75 líneas). Los modales usan TouchableOpacity como overlay que bloquea gestos — un anti-patrón ya corregido en CenterModal. El header es estático y ocupa espacio valioso en pantallas pequeñas y en landscape.

---

## Solution

Limpiar POSScreen en 4 sub-PRs incrementales. Cada PR reduce complejidad sin cambiar funcionalidad visible (excepto edit mode que se elimina intencionalmente).

---

## Changes

### PR 1a — fix/pos-remove-edit-mode

Eliminar edit mode y Alert.alert del POSScreen. La edición y eliminación de productos pertenece a AddProductScreen, no al POS.

Eliminar del POSScreen:
- Estado editMode y función toggleEditMode
- Botón edit en el header (el TouchableOpacity con Feather edit-2 / texto "Listo")
- Delete overlay que aparece sobre cada card en edit mode
- Función handleDeleteProduct completa (usa Alert.alert)
- Import de Alert de react-native
- Funciones requestPinAction, handlePinVerified, closeAdminPin, y estado showAdminPin/pendingAction — solo si NO se usan para otra cosa en el POSScreen. Verificar antes de eliminar.
- Componente PinKeypadModal y su import — solo si ya no se usa en el POSScreen después de eliminar edit mode.
- Variable isAdminUser — solo si ya no se usa.
- Imports de deleteProduct de useApp, removeProductFromTab y removeProductFromAllTabs de useTab — solo si ya no se usan.

En handleProductTap, eliminar el guard `if (editMode) return;` de la primera línea.

Los estilos huérfanos (editBtn, editBtnText, deleteOverlay, deleteText) deben eliminarse del StyleSheet.

Verificación: grep -r "editMode\|handleDeleteProduct\|toggleEditMode\|Alert\.alert" src/screens/POSScreen.js debe dar 0 resultados después del cambio.

### PR 1b — refactor/extract-cart-sheet

Extraer el modal del carrito a src/components/CartSheet.js.

El componente CartSheet recibe como props: visible, onClose, cart, cartTotal, onRemoveItem, onClearCart, onCheckout, theme.

Mover todo el bloque del Modal visible={showCart} (líneas 281-353 actuales) al nuevo componente.

En el nuevo componente, reemplazar el patrón de overlay TouchableOpacity + TouchableOpacity interior por el patrón correcto: Pressable con StyleSheet.absoluteFill para el backdrop (lección de CenterModal retro). El sheet interior sigue siendo un View normal, no Pressable.

POSScreen importa CartSheet y le pasa las props. El estado showCart se queda en POSScreen.

Mover los estilos relacionados al carrito (cartOverlay, cartSheet, cartHandle, cartHeader, cartTitle, cartList, cartItem, cartItemLeft, cartItemIcon, cartItemName, cartItemDetail, cartItemNote, cartIngredientDots, cartIngDot, cartItemRight, cartItemPrice, cartFooter, cartTotalRow, cartTotalLabel, cartTotalAmount, cartActions, cartClearBtn, cartClearText, cartCheckoutBtn, cartCheckoutText) al StyleSheet dentro de CartSheet.js.

### PR 1c — refactor/extract-simple-product-sheet

Extraer el modal de producto simple a src/components/SimpleProductSheet.js.

El componente recibe como props: visible, onClose, product, currentMode, onAddToCart, theme.

Toda la lógica de sizeQuantities, adjustSize, simpleTotal, simpleHasItems, y handleSimpleConfirm se mueve DENTRO del nuevo componente — es lógica interna del modal, no del POS.

Mover todo el bloque del Modal visible={showSimpleModal} (líneas 356-430 actuales) al nuevo componente.

Reemplazar el patrón de overlay TouchableOpacity + TouchableOpacity por Pressable + absoluteFill (mismo patrón que PR 1b).

POSScreen importa SimpleProductSheet y le pasa las props. Los estados selectedProduct y showSimpleModal se quedan en POSScreen. El estado sizeQuantities se mueve al nuevo componente.

Mover los estilos relacionados (simpleOverlay, simpleSheet, simpleHandle, simpleHeader, simpleIconWrap, simpleProductName, sizeRows, sizeRow, sizeRowInfo, sizeRowName, sizeRowPrice, sizeRowCounter, counterBtn, counterBtnText, counterNum, simpleConfirmBtn, simpleConfirmText, simpleConfirmTotal) al StyleSheet dentro de SimpleProductSheet.js.

### PR 1d — feat/pos-collapsible-header

Header colapsable opción A (mini-bar). Al hacer scroll hacia abajo, el header se colapsa a una barra mínima mostrando solo el nombre del worker y el indicador de modo. Al hacer scroll hacia arriba, el header se expande de nuevo.

Implementación con Animated.event vinculado al onScroll del ScrollView principal de productos. useNativeDriver: false (porque animamos height/opacity que no soportan native driver en RN).

El header completo tiene dos estados visuales:
- Expandido (default): nombre del worker, dot de status, tab bar con pills. Tal como está ahora.
- Colapsado (mini-bar): una sola fila compacta con el nombre del worker, dot de status, y si hay modo activo el indicador de modo. La tab bar se oculta con opacity 0 y height 0.

El scroll threshold para colapsar debe ser bajo (~50px) para que se sienta responsivo.

La animación debe usar Animated.interpolate para transicionar suavemente entre estados. No usar LayoutAnimation (causa glitches con FlatList/ScrollView).

El ScrollView de productos debe cambiar a Animated.ScrollView para poder vincular el evento onScroll.

---

## Rules

1. Cada sub-PR es independiente y mergeable por separado. El orden es estricto: 1a → 1b → 1c → 1d.
2. Cada sub-PR debe dejar POSScreen funcional y sin errores.
3. Patrón de overlay en modales: Pressable + StyleSheet.absoluteFill para backdrop, View para sheet. No TouchableOpacity ni TouchableWithoutFeedback.
4. Tests 0 fallos obligatorio en cada sub-PR.
5. Cada sub-PR actualiza CLAUDE.md si cambia el conteo de tests o suites.
6. Cada sub-PR crea su propio retro en docs/feature_retros/.
7. Antes de abrir cada PR, grep el repo entero para verificar que no quedan imports huérfanos ni referencias a código eliminado.

---

## Verification

### PR 1a
- Edit mode eliminado: no existe botón de editar, no aparece overlay de delete, no hay Alert nativo
- Tap en producto funciona normalmente (productos simples abren modal, elaborados van a OrderBuilder)
- grep -r "editMode\|Alert\.alert" src/screens/POSScreen.js da 0 resultados
- npm test 0 fallos

### PR 1b
- CartSheet renderiza idéntico al modal inline anterior
- Tap en backdrop (área oscura) cierra el modal
- Scroll dentro del carrito funciona correctamente
- Botones Vaciar y COBRAR funcionan
- POSScreen.js tiene ~75 líneas menos
- npm test 0 fallos

### PR 1c
- SimpleProductSheet renderiza idéntico al modal inline anterior
- Contadores de tamaño funcionan (+/-)
- Botón "Agregar al pedido" agrega correctamente al carrito
- Tap en backdrop cierra el modal
- POSScreen.js tiene ~75 líneas menos
- npm test 0 fallos

### PR 1d
- Scroll hacia abajo colapsa header suavemente
- Scroll hacia arriba expande header suavemente
- No hay flicker ni saltos durante la animación
- Tab bar se oculta/muestra con el colapso
- Funciona en portrait y landscape, phone y tablet
- npm test 0 fallos
