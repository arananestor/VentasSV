# Feature Retro: OrderBuilderScreen Redesign + Global Backdrop Fix

- **Date:** 2026-05-06
- **PR:** feature/order-builder-redesign
- **Design doc:** docs/architecture_design/order_builder_redesign.md

## Resumen

Global backdrop fix en 4 archivos (BottomSheetModal, ModeEditorScreen, OrdersScreen, ProfileScreen) usando Pressable + absoluteFill. Migración de OrderBuilderScreen a useResponsive eliminando Dimensions.get estático. Reemplazo de Alert.alert por CenterModal de confirmación.

## Cambios

- **src/components/BottomSheetModal.js** — Pressable + absoluteFill agregado como primer hijo del overlay. Tap en backdrop cierra el modal (todos los consumidores, incluyendo IconColorPicker, ganan cierre por backdrop automáticamente).
- **src/screens/ModeEditorScreen.js** — Palette modal: TouchableOpacity overlay → View + Pressable absoluteFill. onStartShouldSetResponder eliminado.
- **src/screens/OrdersScreen.js** — CookModal y OrderDetailModal: doble TouchableOpacity anidado → View + Pressable absoluteFill para overlay, View para sheet.
- **src/screens/ProfileScreen.js** — Modal agregar empleado: Pressable absoluteFill con onPress={resetAddForm} agregado dentro del KeyboardAvoidingView. Inner TouchableWithoutFeedback eliminado.
- **src/screens/OrderBuilderScreen.js** — Dimensions.get('window') estático → useResponsive() reactivo. minWidth de ingredientBtn y extraBtn movidos de StyleSheet a inline styles. Alert.alert → CenterModal con estado unitToDelete. Imports de Dimensions y Alert eliminados, CenterModal y useResponsive agregados.

## Qué funcionó

- BottomSheetModal con Pressable en el overlay beneficia a todos los consumidores actuales y futuros — un solo cambio con efecto multiplicador
- CenterModal existente para confirmación de eliminación de unidades evitó crear un modal nuevo — reutilización directa

## Lecciones

- El patrón de doble TouchableOpacity (overlay + inner con onPress={() => {}}) funciona pero produce feedback visual incorrecto con activeOpacity. Pressable + absoluteFill es el patrón correcto porque no tiene feedback visual
- onStartShouldSetResponder={() => true} es innecesario con Pressable sibling — el sibling captura los taps antes de que lleguen al content por orden de renderizado
