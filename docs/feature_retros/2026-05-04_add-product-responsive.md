# Feature Retro: AddProductScreen Responsive + Alert Cleanup

- **Date:** 2026-05-04
- **PR:** refactor/add-product-responsive
- **Design doc:** docs/architecture_design/add_product_redesign.md

## Resumen

Migración de AddProductScreen a useResponsive, eliminación de los 5 Alert.alert nativos (reemplazados por showNotif del AppContext), y corrección del overlay en el modal de paleta de ingredientes/extras (TouchableOpacity → Pressable + absoluteFill).

## Cambios

- **src/screens/AddProductScreen.js** — Import de Alert eliminado. useResponsive importado y padding extraído. showNotif de useApp para validaciones de formulario y permisos de cámara. Modal de paleta: TouchableOpacity overlay reemplazado por Pressable + StyleSheet.absoluteFill (patrón CenterModal). onStartShouldSetResponder eliminado (ya no necesario con Pressable sibling).

## Qué funcionó

- showNotif es ideal para validaciones rápidas — muestra un toast corto sin interrumpir el flujo del usuario (mejor UX que Alert.alert que requiere tap para cerrar)
- El patrón Pressable + absoluteFill ya está probado en CartSheet, SimpleProductSheet y CenterModal — aplicarlo aquí fue directo

## Lecciones

- Alert.alert nativo es un anti-patrón en esta app por regla de proyecto — siempre usar el snackbar/notification system del AppContext
- Con Pressable + absoluteFill como sibling, no se necesita onStartShouldSetResponder en el modal interior — Pressable captura los taps en el backdrop y el View del modal no los propaga
