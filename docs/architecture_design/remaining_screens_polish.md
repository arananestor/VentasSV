# Architecture Design: Remaining Screens Polish

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-05-16
- Target branch: refactor/remaining-screens-polish (ejecución en un solo PR)

---

## Problem

Cuatro pantallas del sistema POS todavía usan anti-patterns que ya fueron eliminados en el resto de la app: Alert.alert nativo (la app usa showNotif para mensajes informativos y CenterModal para confirmaciones destructivas) y Dimensions.get('window') estático a nivel de módulo (la app usa el hook useResponsive para cálculos reactivos de layout).

Las pantallas afectadas son:

- ManageTabsScreen.js — 4 Alert.alert: dos de validación de nombre vacío, uno de restricción (no se puede borrar pestaña principal), uno de confirmación de eliminar pestaña
- SalesScreen.js — 3 Alert.alert: "Sin ventas" al exportar, "Sin ubicaciones" al exportar, error genérico de exportación
- SelectWorkerScreen.js — Dimensions.get('window') estático (línea 11) para calcular CARD_SIZE del grid de workers
- OrdersScreen.js — Dimensions.get('window') estático (línea 13) para SCREEN_WIDTH usado en animaciones de swipe del PanResponder

---

## Solution

Eliminar todos los Alert.alert restantes reemplazándolos con showNotif (mensajes informativos/validación/errores) o CenterModal (confirmaciones destructivas), y migrar los Dimensions.get estáticos a useResponsive. Después de este PR no debe quedar ningún Alert.alert ni Dimensions.get('window') en ningún screen de la app.

---

## Changes

### ManageTabsScreen.js — Eliminar 4 Alert.alert

Línea 29 (handleAdd): Alert.alert('', 'Ponele un nombre') — validación de nombre vacío. Reemplazar con showNotif('Ponele un nombre'). Requiere importar useApp y extraer showNotif.

Línea 36 (handleUpdate): Alert.alert('', 'Ponele un nombre') — misma validación en edición. Reemplazar con showNotif('Ponele un nombre').

Línea 43 (handleDelete): Alert.alert('', 'No podés eliminar la pestaña principal') — restricción de negocio. Reemplazar con showNotif('No podés eliminar la pestaña principal') y return.

Línea 44 (handleDelete): Alert.alert('Eliminar', '¿Eliminar "X"?', [...]) — confirmación destructiva. Reemplazar con CenterModal de confirmación. Agregar estado tabToDelete. onPress del botón eliminar cambia a setTabToDelete(tab). CenterModal con título dinámico "¿Eliminar pestaña?", texto con el nombre, botón Cancelar y botón Eliminar que ejecuta deleteTab(tabToDelete.id) y cierra. CenterModal ya está importado en este archivo.

Eliminar import de Alert.

### SalesScreen.js — Eliminar 3 Alert.alert

Línea 84: Alert.alert('Sin ventas', 'No hay ventas del día para exportar.') — informativo, no requiere acción del usuario. Reemplazar con showNotif('No hay ventas del día para exportar'). Requiere importar showNotif desde useApp (ya importa useApp en línea 14, solo agregar showNotif al destructuring).

Línea 89: Alert.alert('Sin ubicaciones', 'Ninguna venta del día tiene ubicación registrada.') — informativo. Reemplazar con showNotif('Ninguna venta tiene ubicación registrada').

Línea 99: Alert.alert('Error', e.message || 'No se pudo generar el archivo.') — error de exportación. Reemplazar con showNotif(e.message || 'No se pudo generar el archivo').

Eliminar import de Alert.

### SelectWorkerScreen.js — Migrar a useResponsive

Línea 11: const { width } = Dimensions.get('window') — estático. Eliminar esta línea y las constantes CARD_GAP, PADDING, CARD_SIZE que dependen de ella (líneas 12-14).

Dentro del componente: usar const { width, padding, gap } = useResponsive(). Calcular CARD_SIZE como (width - (padding * 2) - gap) / 2 dentro del componente.

El StyleSheet usa CARD_SIZE (línea 101 workerCard width) y PADDING (línea 90 header paddingHorizontal, línea 96 grid paddingHorizontal). Mover estos valores a inline styles usando los valores reactivos del hook.

Import: import useResponsive from '../hooks/useResponsive'. Eliminar import de Dimensions.

### OrdersScreen.js — Migrar a useResponsive

Línea 13: const { width: SCREEN_WIDTH } = Dimensions.get('window') — estático. Eliminar.

SCREEN_WIDTH se usa en el componente SwipeableOrderCard para PanResponder (cálculos de swipe threshold y animaciones, líneas 480-511) y en un estilo de snackbar (línea 54 maxWidth). Estos son componentes internos del archivo que reciben props.

Dentro del componente principal OrdersScreen: usar const { width: screenWidth } = useResponsive() y pasar screenWidth como prop a SwipeableOrderCard y al snackbar.

Dentro de SwipeableOrderCard: recibir screenWidth como prop y usarlo donde antes decía SCREEN_WIDTH.

Para el snackbar (línea 54): mover maxWidth a inline style usando screenWidth.

Import: import useResponsive from '../hooks/useResponsive'. Eliminar import de Dimensions.

---

## Rules

Si dos o más lugares comparten la misma función o componente, cualquier cambio se aplica a TODOS. Antes de abrir PR, verificar con grep -r "Alert\.alert" src/screens/ y grep -r "Dimensions\.get" src/screens/ que ambos devuelvan cero resultados.

Commit convention: type(scope): description en inglés. Sin firmas ni atribuciones. Sin Co-Authored-By ni Generated with Claude Code.

---

## Verification

El PR queda verificado si: grep -r "Alert.alert" src/screens/ devuelve cero resultados, grep -r "Dimensions.get" src/screens/ devuelve cero resultados. ManageTabsScreen: crear pestaña sin nombre muestra notificación (no Alert nativo), eliminar pestaña muestra CenterModal, intentar eliminar pestaña principal muestra notificación. SalesScreen: exportar sin ventas muestra notificación. SelectWorkerScreen: rotar pantalla recalcula el grid de workers. OrdersScreen: swipe en las cards de comandas funciona correctamente con el width reactivo. npm test pasa con 0 failures.
