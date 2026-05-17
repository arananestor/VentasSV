# Feature Retro: Remaining Screens Polish

- **Date:** 2026-05-17
- **PR:** refactor/remaining-screens-polish
- **Design doc:** docs/architecture_design/remaining_screens_polish.md

## Resumen

Eliminación de todos los Alert.alert y Dimensions.get('window') estáticos restantes en la app. Después de este PR: grep -r "Alert.alert" src/screens/ y grep -r "Dimensions.get" src/screens/ devuelven cero resultados.

## Cambios

- **ManageTabsScreen.js** — 4 Alert.alert eliminados: 2 de validación → showNotif, 1 de restricción → showNotif, 1 de confirmación destructiva → CenterModal con estado tabToDelete. Import de Alert eliminado, useApp importado para showNotif.
- **SalesScreen.js** — 3 Alert.alert eliminados: informativos de exportación → showNotif. Import de Alert eliminado, showNotif agregado al destructuring de useApp.
- **SelectWorkerScreen.js** — Dimensions.get('window') estático → useResponsive(). CARD_SIZE, PADDING, CARD_GAP calculados dentro del componente. StyleSheet simplificado, valores reactivos en inline styles.
- **OrdersScreen.js** — Dimensions.get('window') estático → useResponsive(). screenWidth pasado como prop a OrderCard. SCREEN_WIDTH reemplazado por screenWidth en PanResponder (swipe threshold, animations, color interpolation). Toast maxWidth fijado a 320px.

## Qué funcionó

- showNotif para mensajes informativos y CenterModal para confirmaciones destructivas es un patrón ya establecido — aplicarlo fue directo
- useResponsive en SelectWorkerScreen permite que el grid de workers se adapte correctamente a rotación
- Pasar screenWidth como prop a OrderCard (componente interno) es el patrón más simple para componentes que usan PanResponder — el PanResponder se recrea si la prop cambia

## Lecciones

- Al migrar Dimensions.get estático a useResponsive, verificar si hay StyleSheet.create que referencia las constantes calculadas — esas necesitan moverse a inline styles
- OrdersScreen Toast maxWidth: usar un valor fijo (320) es aceptable cuando el componente es decorativo y no necesita precisión pixel-perfect al rotar
