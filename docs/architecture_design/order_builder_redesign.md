# Architecture Design: OrderBuilderScreen Redesign + Global Backdrop Fix

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-05-04
- Target branch: feature/order-builder-redesign (ejecución en un solo PR)

---

## Problem

OrderBuilderScreen usa Dimensions.get('window') al nivel del módulo (línea 15), lo que calcula el ancho una sola vez al importar. Si el dispositivo rota o cambia de tamaño, los grids de ingredientes y extras no se recalculan — sus minWidth quedan fijos con el ancho inicial. Además, la pantalla usa Alert.alert nativo (línea 200) para confirmar eliminación de unidades, rompiendo la regla de que VentasSV nunca usa Alert nativo sino modales custom.

Por otro lado, existe un problema global de UX: varios modales en la app no cierran al tocar el backdrop (el área oscura fuera del contenido), o usan TouchableOpacity como overlay (anti-pattern que produce feedback visual incorrecto con activeOpacity). El patrón correcto ya existe en CenterModal.js (Pressable + StyleSheet.absoluteFill) y debe aplicarse a todos los modales que no lo implementan. Estos modales son:

- BottomSheetModal.js — overlay es un View sin onPress, solo cierra con botón X
- ModeEditorScreen.js — palette modal usa TouchableOpacity como overlay con onStartShouldSetResponder
- OrdersScreen.js — CookModal y OrderDetailModal usan TouchableOpacity anidados (funciona pero anti-pattern)
- ProfileScreen.js — modal "AGREGAR EMPLEADO" no tiene cierre por backdrop en absoluto

---

## Solution

Se migra OrderBuilderScreen al hook useResponsive (src/hooks/useResponsive.js) que usa useWindowDimensions reactivo, se reemplaza el Alert.alert por un CenterModal de confirmación (componente existente en src/components/CenterModal.js), y se unifica el patrón de backdrop en todos los modales pendientes usando Pressable + StyleSheet.absoluteFill siguiendo CenterModal como referencia.

El patrón correcto de backdrop es: dentro del Modal, un View como overlay con Pressable absoluteFill onPress={onClose} como primer hijo, y el View del content posicionado encima por orden de renderizado. Al tocar fuera del content se toca el Pressable y cierra. No necesita onStartShouldSetResponder, no necesita TouchableOpacity anidados, no produce feedback visual.

---

## Cambios por archivo

### Global Backdrop Fix

src/components/BottomSheetModal.js — Agregar Pressable con StyleSheet.absoluteFill y onPress={onClose} como primer hijo del View overlay, antes del sheet. Importar Pressable y StyleSheet de react-native. El único consumidor actual es IconColorPicker, que ganará cierre por backdrop automáticamente.

src/screens/ModeEditorScreen.js (~línea 510) — El palette modal usa TouchableOpacity con flex:1 y backgroundColor: theme.overlay como overlay, y el inner View usa onStartShouldSetResponder. Reemplazar por: View overlay con backgroundColor + Pressable absoluteFill onPress={close} + View content. Eliminar onStartShouldSetResponder. Importar Pressable si no está importado.

src/screens/OrdersScreen.js (~líneas 170 y 337) — CookModal usa TouchableOpacity activeOpacity={1} onPress={onClose} como overlay y TouchableOpacity activeOpacity={1} onPress={() => {}} como inner. OrderDetailModal usa el mismo patrón. Migrar ambos: reemplazar el TouchableOpacity overlay por View + Pressable absoluteFill, reemplazar el TouchableOpacity inner por View. La funcionalidad de cierre se conserva pero con el patrón correcto.

src/screens/ProfileScreen.js (~línea 367) — El modal "AGREGAR EMPLEADO" usa TouchableWithoutFeedback onPress={Keyboard.dismiss} como wrapper del KeyboardAvoidingView. No tiene cierre por backdrop — solo se cierra con X. Agregar Pressable con StyleSheet.absoluteFill y onPress={resetAddForm} dentro del Modal y fuera del KeyboardAvoidingView. El TouchableWithoutFeedback interno para dismiss keyboard se mantiene.

### OrderBuilderScreen Responsive

src/screens/OrderBuilderScreen.js línea 15 — Reemplazar const { width } = Dimensions.get('window') (estático, nivel de módulo) por el hook useResponsive dentro del componente: const { width } = useResponsive(). Import: import useResponsive from '../hooks/useResponsive'. Eliminar import de Dimensions.

src/screens/OrderBuilderScreen.js líneas 411, 419 en StyleSheet — ingredientBtn minWidth: (width - 48) / 3 y extraBtn minWidth: (width - 48) / 2.5 usan el width estático del módulo. Sacar estos minWidth del StyleSheet (que es estático) y moverlos a inline styles dentro del render usando el width reactivo del hook.

### OrderBuilderScreen Eliminar Alert.alert

src/screens/OrderBuilderScreen.js línea 200 — Alert.alert en onLongPress de unit tabs para confirmar eliminación. Reemplazar con CenterModal (componente existente). Agregar estado unitToDelete. El onLongPress cambia a setUnitToDelete(i). CenterModal al final del JSX con título dinámico, botón Cancelar que cierra, y botón Eliminar que ejecuta removeUnit y cierra. Import de CenterModal y eliminar import de Alert.

---

## Roadmap de ejecución

El feature se entrega en un solo PR porque los cambios son cohesivos (todos migran pantallas a calidad de producción), ninguno excede complejidad significativa, y separarlos produciría PRs triviales que ralentizan el ciclo.

PR 1 — feature/order-builder-redesign: aplica el backdrop fix en los 4 archivos (BottomSheetModal, ModeEditorScreen, OrdersScreen, ProfileScreen), migra OrderBuilderScreen a useResponsive eliminando Dimensions.get estático, y reemplaza Alert.alert por CenterModal de confirmación.

---

## Reglas globales

Si dos o más lugares comparten la misma función o componente, cualquier cambio se aplica a TODOS — idéntico o adaptado. Nunca dejar un lugar actualizado y otro con la versión vieja. Antes de abrir PR, verificar con grep que no queden modales con el patrón viejo.

Commit convention: type(scope): description en inglés. Sin firmas ni atribuciones. Sin Co-Authored-By ni Generated with Claude Code.

---

## Verification

El PR queda verificado si: tocar el backdrop cierra el modal en BottomSheetModal (via IconColorPicker), en ModeEditorScreen (palette de colores), en OrdersScreen (CookModal y OrderDetailModal), y en ProfileScreen (modal agregar empleado). OrderBuilderScreen: rotar pantalla hace que el grid de ingredientes y extras se recalcule al nuevo ancho. Long press en un unit tab muestra CenterModal de confirmación en vez de Alert nativo. npm test pasa con 0 failures. No queda ningún Alert.alert en OrderBuilderScreen ni ningún Dimensions.get('window') estático.
