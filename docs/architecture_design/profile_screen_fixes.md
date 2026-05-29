# Architecture Design: ProfileScreen Fixes

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-05-17
- Target branch: feature/profile-screen-fixes

---

## Problem

La pantalla ProfileScreen (src/screens/ProfileScreen.js) tiene cuatro deficiencias que la mantienen por debajo del estándar del resto de la app post polish phase:

1. Bug productivo en handlePhotoPress (líneas 78 a 83): el código abre el image picker dos veces consecutivas en iOS. La primera llamada hace destructuring de una propiedad inexistente (ImagePickerAssets) sobre el return de launchImageLibraryAsync y descarta el resultado. La segunda llamada vuelve a abrir el picker. En iOS el usuario ve el picker dos veces seguidas; el resultado de la primera selección se pierde silenciosamente.

2. Dos botones separados para una misma intención (cámara y galería) en la tarjeta de perfil. Patrón anti-profesional: las apps de referencia (Toast, Stripe Identity, Airbnb host onboarding) unifican esto en un solo botón "Cambiar foto" que abre un selector con ambas opciones. Además, hoy solo se piden permisos de cámara — la galería se invoca sin requestMediaLibraryPermissionsAsync.

3. Modal de "Cambiar turno" / "Cerrar sesión" es un CenterModal genérico que solo confirma la acción. No muestra nada del turno que se está cerrando: cuánto trabajó la persona, qué vendió, cuánto cobró. Es el momento más ceremonial del día para el empleado y la app lo despacha con un "¿Seguro?".

4. La tarjeta de perfil no muestra contexto del día. Avatar, nombre, puesto. Sin información operativa visible (ventas hoy, tickets hoy, hora de inicio del turno).

---

## Solution

Refactor de ProfileScreen para alcanzar paridad con el resto de la app post polish. Cuatro intervenciones, todas dentro del mismo PR de execution porque pertenecen a la misma pantalla y comparten dependencias:

1. Compact summary band — franja superior delgada sobre la tarjeta de perfil con tres números del día.
2. Unified photo picker — un solo botón en la tarjeta que abre un BottomSheetModal con "Tomar foto" y "Elegir de galería".
3. Custom shift summary modal — reemplazo del CenterModal genérico con un modal rico que muestra resumen del turno y permite compartirlo por WhatsApp.
4. Bug fix de handlePhotoPress.

---

## Changes

### Nueva infraestructura: tracking del inicio de turno

#### src/context/AuthContext.js

Agregar un campo shiftStartedAt al currentWorker session. No es persistente — vive en el state del context, no en AsyncStorage. Sin migración, sin cambios al schema de workers en disco.

Cuando loginWithPin retorna un worker válido y se hace setCurrentWorker, también guardar el timestamp ISO de ese momento como shiftStartedAt en el state. Cuando switchWorker o logout limpian currentWorker, también se limpia shiftStartedAt.

Exponer shiftStartedAt en el value del provider para que los consumidores puedan leerlo vía useAuth().

Fallback: si la app abre con un worker ya autenticado (workers que estaban logueados antes de este PR), shiftStartedAt arranca como null. La UI debe tratar null como "sin info de turno" y mostrar un fallback amable.

### Nueva lógica pura: shiftSummary

#### src/utils/shiftSummary.js (NUEVO)

Función pura computeShiftSummary que recibe un objeto con shape:

- shiftStartedAt: string ISO o null
- sales: array de sales (estructura ya definida en AppContext con timestamp, items[], paymentMethod, total, workerId opcional)
- workerId: string del empleado actual
- now: timestamp ISO opcional (para testeabilidad, default new Date().toISOString())

Devuelve un objeto con shape:

- durationMs: number — diferencia en milisegundos entre now y shiftStartedAt, o null si shiftStartedAt es null
- durationLabel: string — duración formateada como "3h 24min" o "45min", o "—" si null
- ticketCount: number — cantidad de sales dentro del rango del turno
- total: number — suma de los totales de las sales del turno
- byMethod: objeto con claves de método de pago (efectivo, tarjeta, transferencia) y valores numéricos del total cobrado por método. Métodos no presentes no aparecen en el objeto.
- topProducts: array de hasta 3 elementos con shape { name, units }, ordenado descendente por units. units suma todas las units[] de todos los items[] que coinciden con ese nombre de producto.

Reglas de filtrado:
- Si shiftStartedAt es null, retornar todos los campos con valores cero o null y array vacío para topProducts.
- Una sale entra en el turno si new Date(sale.timestamp) >= new Date(shiftStartedAt) AND (sale.workerId === workerId OR sale.workerId está ausente). El OR cubre el caso de sales históricas que no tienen workerId.

#### src/utils/shareShiftSummary.js (NUEVO)

Función pura formatShiftSummaryMessage(summary, worker, businessName) que devuelve un string formateado para WhatsApp con saltos de línea, emojis sobrios (✓, •), título con nombre del negocio y empleado, y los números del resumen en formato salvadoreño (símbolo de dólar antes del número, dos decimales). Sin emojis si la línea de tono del proyecto lo prohíbe — verificar formatters.js existente para mantener consistencia.

Función pura shareShiftSummary(message) que usa expo-sharing con la misma firma que ticketPrinter.js usa hoy. Si el dispositivo no soporta sharing, retorna false y deja que el caller maneje el fallback (showNotif).

### Nuevos componentes UI

#### src/components/CompactSummaryBand.js (NUEVO)

Componente funcional. Recibe props: { shiftStartedAt, sales, currentWorker, isOwnerView }. Internamente usa useTheme y useResponsive.

Renderiza una franja horizontal delgada (altura aproximada 56px) con tres celdas separadas por divisores verticales sutiles:

- Celda 1: "VENTAS HOY" label arriba (textMuted, 9px, letterSpacing 2, bold 800), valor abajo (text, 16px, bold 800). Valor: total del turno en formato $X.XX.
- Celda 2: "TICKETS" label arriba, valor abajo. Valor: ticketCount.
- Celda 3: "TURNO DESDE" label arriba, valor abajo. Valor: hora de inicio formateada como "HH:MM". Si shiftStartedAt es null, mostrar "—".

Si isOwnerView es true, en lugar de filtrar por workerId, computar el summary sobre todas las sales del día (mismo día calendario que now). Cambiar labels a "VENTAS NEGOCIO", "TICKETS NEGOCIO", "DÍA DESDE 00:00" o equivalente. Decidir el wording final priorizando legibilidad en pantalla angosta.

Si shiftStartedAt es null y no es owner view, retornar null (no renderizar nada). El band solo aparece con contexto de turno activo.

Estilo coherente con el resto de la app: backgroundColor theme.card, borderColor theme.cardBorder, borderRadius 16, padding interno controlado, marginTop sobre la tarjeta de perfil.

#### src/components/PhotoPickerSheet.js (NUEVO)

Componente funcional que envuelve BottomSheetModal existente. Props: { visible, onClose, onPickFromCamera, onPickFromGallery }.

Title del sheet: "CAMBIAR FOTO".

Children: dos rows estilo opción, cada uno una TouchableOpacity con: ícono Feather (camera o image) a la izquierda, label en español ("Tomar foto" / "Elegir de galería"), chevron-right a la derecha. Padding consistente con el resto de los rows de ProfileScreen.

Cada row, al ser tocado: cierra el sheet primero, luego ejecuta el callback correspondiente. La separación temporal evita que el picker se abra encima del sheet en algunos devices.

#### src/components/ShiftSummaryModal.js (NUEVO)

Componente funcional. Props: { visible, onClose, onConfirm, worker, summary, deviceType, businessName }.

Estructura visual de arriba hacia abajo:

1. Header del modal con foto o avatar del worker (40x40), nombre completo (16px bold 900), badge de puesto debajo (mismo estilo del detail modal existente).
2. Card con la duración del turno: ícono clock a la izquierda, label "TIEMPO TRABAJADO" arriba, valor durationLabel abajo (grande, bold 900).
3. Grid 2x1 con dos cards lado a lado: ventas totales (total formateado $X.XX, label "TOTAL DEL TURNO") y tickets (ticketCount, label "TICKETS").
4. Lista byMethod: si hay al menos un método con valor > 0, listar cada método con ícono pequeño (cash, credit-card, smartphone para transferencia), nombre del método capitalizado, valor a la derecha. Si byMethod está vacío, omitir esta sección.
5. Lista topProducts: si hay productos, título pequeño "MÁS VENDIDOS", luego cada producto con su nombre y units (formato "Pupusa de queso ×8"). Máximo 3 entradas.
6. Botón primario: "CERRAR TURNO" si deviceType === 'fixed', "SALIR" si deviceType === 'personal'. backgroundColor theme.accent. Ejecuta onConfirm.
7. Botón secundario: "COMPARTIR RESUMEN" en outline. Ícono share-2 a la izquierda. Solo visible si summary tiene al menos un ticket (ticketCount > 0). Al tocar: formatea el mensaje, llama shareShiftSummary. Si falla, llama showNotif del AppContext con mensaje en español.
8. Botón terciario: "Cancelar" en texto plano, padding vertical. Ejecuta onClose.

Si summary es null o shiftStartedAt es null (turno sin info), el modal muestra solo el header, el botón primario y el cancelar. Las secciones de resumen se omiten. Mensaje sutil debajo del header: "No se registró el inicio de este turno."

Backdrop sigue el patrón de la app: Pressable + StyleSheet.absoluteFill. No usar CenterModal porque queremos un layout más alto y rico que el formato compacto de CenterModal.

### Cambios en ProfileScreen.js

1. Eliminar handlePhotoPress y handleCameraPress actuales. Reemplazar por:
   - openPhotoPicker: setea showPhotoPicker(true).
   - onPickFromCamera: llama requestCameraPermissionsAsync, si granted llama launchCameraAsync con las mismas opciones de hoy, si éxito llama updateWorkerPhoto. Si permiso denegado, showNotif("Permiso de cámara denegado").
   - onPickFromGallery: llama requestMediaLibraryPermissionsAsync (nuevo, no se hacía), si granted llama launchImageLibraryAsync, mismo manejo. Si permiso denegado, showNotif("Permiso de galería denegado").

2. Eliminar el doble botón de foto (líneas 142 a 155) y reemplazarlo por un único botón "Cambiar foto" (ícono camera + texto pequeño "Cambiar foto") en la tarjeta de perfil. Al tocar, openPhotoPicker.

3. Importar y renderizar CompactSummaryBand al inicio del ScrollView, antes de la tarjeta de perfil. Pasar shiftStartedAt (del useAuth), sales (del useApp), currentWorker, isOwnerView (true si role === 'owner' y devicePolicy lo amerita; por ahora, true solo si currentWorker.role === 'owner' AND deviceType === 'fixed').

4. Importar y renderizar PhotoPickerSheet al final del componente, controlado por showPhotoPicker state.

5. Reemplazar el CenterModal de showSwitchModal (líneas 297 a 332) por ShiftSummaryModal. Calcular summary inline con computeShiftSummary({ shiftStartedAt, sales, workerId: currentWorker?.id }) dentro del render. Pasar onConfirm = handleSwitchConfirm. Pasar businessName del businessConfig (vía useApp si está expuesto, sino se omite del mensaje de share).

6. Mantener todos los demás modales como están: detalle de perfil, eliminar empleado, agregar empleado, PinKeypadModal de owner.

### Cambios en AuthContext (recordatorio explícito)

Solo lo descrito arriba: shiftStartedAt en state, no persistente, expuesto en el value del provider, seteado en loginWithPin, limpiado en switchWorker y logout. Sin migraciones. Sin cambios al schema de workers.

### Tests

Crear los siguientes archivos en __tests__/unit/. AAA pattern obligatorio. Importar funciones reales de src/, nunca reimplementar lógica.

#### __tests__/unit/shiftSummary.test.js (NUEVO)

Cubrir casos:
- shiftStartedAt null devuelve duration null, label "—", cero ticketCount, total 0, byMethod {}, topProducts [].
- Sales fuera del rango del turno se excluyen.
- Sales sin workerId se incluyen si entran por timestamp.
- Sales de otro workerId se excluyen.
- byMethod agrupa correctamente y suma totales por método.
- topProducts ordena descendente por units y corta a 3 elementos.
- durationLabel formatea "Xh Ymin" para >= 1 hora, "Ymin" para < 1 hora.

#### __tests__/unit/shareShiftSummary.test.js (NUEVO)

Cubrir casos:
- formatShiftSummaryMessage incluye nombre del worker, nombre del negocio si se pasa, total formateado con símbolo $, lista de métodos con sus valores, lista de top productos.
- Si summary.ticketCount es 0, el mensaje informa "Sin ventas registradas en este turno".
- El formato no tiene emojis prohibidos por convención del proyecto (verificar contra formatters.js existente).

#### Tests existentes a auditar y actualizar si rompen

Después de los cambios:
- __tests__/unit/auth.test.js — si tests del AuthContext snapshot del shape del context, ahora incluye shiftStartedAt. Actualizar expectativas.
- Buscar cualquier test que asuma el shape exacto del value del AuthProvider.

### CLAUDE.md

Si el conteo de tests cambia tras correr npm test (sumamos al menos shiftSummary y shareShiftSummary), actualizar el conteo en las dos ubicaciones de CLAUDE.md (bloque Commands y sección Testing). Agregar las suites nuevas a la lista de unit tests en la sección Testing, ordenadas alfabéticamente dentro del grupo existente.

### Retro

Crear docs/feature_retros/[YYYY-MM-DD]_profile-screen-fixes.md siguiendo el formato establecido: Resumen, Cambios (lista de archivos creados o modificados con descripción corta), Qué funcionó, Lecciones. Mencionar explícitamente el bug de handlePhotoPress encontrado durante la lectura del archivo y la decisión de no migrar storage para shiftStartedAt.

---

## Rules

- Sin instalar dependencias nuevas. expo-image-picker, expo-sharing y BottomSheetModal ya están.
- Sin migración de storage. shiftStartedAt vive solo en session state.
- Backdrop de ShiftSummaryModal debe usar Pressable + StyleSheet.absoluteFill, nunca TouchableOpacity, según la regla "Polish phase patterns are mandatory" de CLAUDE.md.
- Cero Alert.alert. Todos los mensajes informativos usan showNotif del AppContext.
- Cero Dimensions.get('window') estático. Si algún cálculo de ancho hace falta, useResponsive.
- Animaciones nuevas (si las hay en ShiftSummaryModal) solo transform y opacity con useNativeDriver: true.
- El execution PR completa esta sección entera. No partir en sub-PRs. Single purpose: ProfileScreen fixes.
- Antes del commit final del execution PR, correr grep -r "Alert.alert" src/ y grep -r "Dimensions.get" src/ para confirmar que siguen en cero. Confirmar también grep -r "shiftStartedAt" src/ y verificar que aparece en AuthContext.js, useAuth consumers que lo necesitan, y los nuevos componentes.

---

## Verification

- npm test pasa con 0 fallos, incluyendo los dos nuevos suites.
- En el simulador o device: abrir la app, hacer login, ir a Perfil. Ver el CompactSummaryBand vacío de tickets pero con la hora de inicio del turno visible.
- Hacer al menos una venta. Volver a Perfil. Confirmar que el band muestra el total y el contador subido.
- Tocar el botón "Cambiar foto". Confirmar que el sheet aparece con dos opciones. Probar ambas. Verificar que se piden permisos.
- Tocar "Cambiar turno" (o "Cerrar sesión" según deviceType). Confirmar que aparece el ShiftSummaryModal con el resumen, el botón "Compartir resumen" abre la hoja de share del sistema con el mensaje correcto.
- Confirmar visualmente que ningún backdrop se siente roto (todos cierran al tocar fuera).
