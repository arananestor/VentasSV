# Feature Retro: ProfileScreen Fixes

- **Date:** 2026-05-17
- **PR:** feature/profile-screen-fixes
- **Design doc:** docs/architecture_design/profile_screen_fixes.md

## Resumen

Cuatro intervenciones en ProfileScreen: compact summary band con ventas/tickets/turno del día, photo picker unificado con BottomSheetModal, shift summary modal rico con resumen del turno y compartir por WhatsApp, y fix del bug de handlePhotoPress que abría el image picker dos veces en iOS. Se agregó shiftStartedAt al AuthContext (session state, no persistente).

## Cambios

- **src/utils/shiftSummary.js** (nuevo) — computeShiftSummary: lógica pura que calcula duración, total, ticketCount, byMethod, topProducts a partir de shiftStartedAt + sales + workerId.
- **src/utils/shareShiftSummary.js** (nuevo) — formatShiftSummaryMessage y shareShiftSummary: formateo de texto para WhatsApp y sharing via expo-sharing.
- **src/context/AuthContext.js** — shiftStartedAt state agregado, seteado en loginWithPin, limpiado en logout/switchWorker, expuesto en provider value.
- **src/components/CompactSummaryBand.js** (nuevo) — Franja con 3 celdas: ventas, tickets, hora de inicio. Owner view muestra totales del día.
- **src/components/PhotoPickerSheet.js** (nuevo) — BottomSheetModal con dos opciones: cámara y galería. Cierra antes de invocar callback.
- **src/components/ShiftSummaryModal.js** (nuevo) — Modal rico con header de worker, duración, total, tickets, byMethod, topProducts, botones cerrar/compartir/cancelar. Backdrop con Pressable + absoluteFill.
- **src/screens/ProfileScreen.js** — handlePhotoPress/handleCameraPress eliminados (bug de doble picker en iOS). Reemplazados por onPickFromCamera/onPickFromGallery con requestMediaLibraryPermissionsAsync (antes no se pedía). Dos botones de foto → uno solo "Cambiar foto". CompactSummaryBand al inicio del scroll. CenterModal de switch → ShiftSummaryModal con resumen.
- **__tests__/unit/shiftSummary.test.js** (nuevo) — 9 tests: null shiftStartedAt, exclusión por timestamp, inclusión sin workerId, exclusión de otro worker, byMethod, topProducts, durationLabel.
- **__tests__/unit/shareShiftSummary.test.js** (nuevo) — 8 tests: nombre worker, business name, formato total, métodos de pago, top productos, sin ventas, duración, omisión de business.
- **CLAUDE.md** — 785 tests, 54 suites. Suites shiftSummary y shareShiftSummary agregadas. Owner avatar treatment y Photo picker pattern documentados en Established Architecture Patterns. Owner mode toggle y Photo picker global migration agregados a Active priorities.
- Refinement commit: celda 3 del CompactSummaryBand simplificada a "TURNO" con cronómetro vivo (sin diferenciación owner/empleado, esa lógica se difiere al PR del Owner mode toggle). Detalle exhaustivo de tickets agregado tanto al ShiftSummaryModal como al share .txt — auditable ticket por ticket con todas las opciones e ítems. topProducts renombrado a productsSummary sin truncación (consumidor hace slice). Fix de avatar de owner en SelectWorkerScreen alineado al patrón establecido en ProfileScreen y ManageModesScreen.

## Qué funcionó

- Bug de handlePhotoPress fue detectado durante la lectura del archivo para el design doc — destructuring de ImagePickerAssets (propiedad inexistente) descartaba el resultado silenciosamente en iOS
- shiftStartedAt en session state sin persistencia evita migración de schema — el tradeoff es que si la app se cierra y reabre, el turno no tiene hora de inicio, pero la UI lo maneja con fallback "—"
- computeShiftSummary como función pura permite testing exhaustivo sin montar contextos React

## Lecciones

- El bug de handlePhotoPress existía desde el inicio y nunca se detectó porque en Android la primera llamada fallaba silenciosamente y la segunda funcionaba — solo en iOS se manifestaba como doble picker
- requestMediaLibraryPermissionsAsync es necesario en iOS 14+ para acceder a la galería — el código anterior no lo pedía y dependía del fallback del sistema
- Separar la lógica de computeShiftSummary del componente UI permitió escribir 9 tests de lógica pura sin mocking de contextos
- El feedback iterativo durante el review del PR encontró cuatro mejoras importantes que el design doc original no había anticipado (cronómetro vivo, detalle exhaustivo de tickets, fix de armonía de avatar, jerarquía visual sin badges ambiguos). El refinement commit dentro del mismo PR — en lugar de un PR aparte — es el patrón correcto cuando el scope se mantiene y solo se profundiza.

## Tercer refinement commit

Tres problemas descubiertos durante testing en device que el design doc no anticipaba:

1. **Shape mismatch entre sale items y el código del primer commit.** El código original usaba `item.product?.name` y `item.size?.name` (el shape del cart item pre-venta), pero buildSaleItem en itemsLogic.js produce `item.productName` (string plano) e `item.size` (string plano). El fallback literal `'Producto'` era lo que se renderizaba en producción para todos los items del ShiftSummaryModal y en productsSummary. Esto pasó inadvertido porque el fallback nunca lanza error — simplemente muestra el valor equivocado.

2. **SalesScreen.buildCSV estaba roto con el modelo items[].** La función local buildCSV leía `s.productName` y `s.size` directamente de la sale (modelo flat viejo), pero desde la migración a items[] esos campos viven dentro de cada item. Se creó `src/utils/salesCsv.js` con `buildSalesCSV` que itera items correctamente, genera una fila por item (15 columnas), y maneja extras como strings u objetos. SalesScreen ahora importa la utility en lugar de tener la lógica inline.

3. **navigation.popToTop() en PaymentScreen** podía fallar silenciosamente si el stack tenía estado inconsistente (modal abierto + async callback). Se reemplazó por `navigation.reset({ index: 0, routes: [{ name: 'HomeMain' }] })` que es determinístico. El grep global confirmó que era la única ocurrencia en toda la app.

**Cambios colaterales no anticipados:**
- shareShiftSummary se reescribió completamente — dejó de generar texto plano y ahora produce un .csv via buildSalesCSV. El filename incluye nombre del worker y timestamp. formatShiftSummaryMessage fue eliminada (función muerta).
- ShiftSummaryModal: la sección de detalle de tickets se simplificó (solo qty × productName · size, sin extras/notas inline) porque los datos completos van en el CSV compartible.
- La suite shareShiftSummary.test.js se redujo a un contrato mínimo (verifica que la función existe y es async) porque la lógica real la testea salesCsv.test.js.

**Lo que funcionó al primer intento:**
- salesCsv.js y sus tests pasaron de una — la interfaz de formatCSVCell + buildSalesCSV era simple y el shape de datos estaba claro tras leer buildSaleItem.
- El fix de popToTop fue trivial: una línea.
- El grep de `item.product?.name` encontró exactamente 4 ocurrencias (2 en utils, 1 en ShiftSummaryModal, 1 en CartSheet que es correcto porque opera sobre cart items).

**Lo que requirió iteración:**
- Los tests de shiftSummary necesitaron actualizar el shape de los sale items de prueba (de `{ product: { name: 'X' } }` a `{ productName: 'X' }`). Esto cambió en 4 lugares del test file.
- shareShiftSummary tests se reescribieron dos veces: primero intenté testear el CSV output, pero como shareShiftSummary es async y depende de FileSystem/Sharing mocks, el test quedó como contrato mínimo — la lógica de CSV se testea completa en salesCsv.test.js.

**Lecciones:**
- Shape mismatch entre módulos puede pasar inadvertido cuando hay un fallback string literal que nunca lanza error. La función parecía funcionar porque devolvía *algo*, pero ese algo era `'Producto'` para todo. Esto confirma la importancia del test `productsSummary uses productName field` que se agregó explícitamente.
- Las funciones locales como buildCSV dentro de screens son difíciles de testear y fáciles de olvidar al migrar el modelo de datos. Extraerlas a utilities con tests propios las hace visibles y verificables.
- La regla "Retros are written from reality" codificada en CLAUDE.md en este mismo commit refleja que el proceso de documentar post-facto es más valioso que pre-dictar el retro desde el plan.

## Cuarto refinement commit

Dos bugs y una mejora de datos que el design doc original no podía haber anticipado porque requirieron probar la app en device con datos reales.

**PinEntryScreen avatar** — El fix de owner avatar en SelectWorkerScreen (segundo commit) no se propagó a PinEntryScreen. La causa fue un carry-over perdido: el architect identificó el patrón en la discusión pero el focus cambió antes de que se ejecutara. Al hacer `grep -rn "worker.color || theme.accent" src/` encontré la única ocurrencia restante en PinEntryScreen.js línea 62. El fix fue idéntico al de SelectWorkerScreen: `worker.role === 'owner' ? theme.accent : (worker.color || '#1C1C1E')` para backgroundColor, `worker.role === 'owner' ? theme.accentText : '#fff'` para el color del texto. Un segundo grep más amplio (`backgroundColor.*worker.*color`) confirmó que SelectWorkerScreen ya estaba correcto y no había otros consumers fuera del patrón.

**Notas por unidad en CSV** — OrderBuilderScreen tiene un campo "NOTA DEL PEDIDO" que, cuando hay 1 sola unidad, se guarda en `units[0].note`, no en `cartItem.note`. buildSaleItem en itemsLogic.js solo lee `cartItem.note`, así que la nota de la UI se perdía silenciosamente en el CSV. La decisión fue resolver en el punto de consumo (salesCsv.js) con un helper `collectNotes(item)` que recorre tanto `item.note` como `item.units[].note`, en lugar de modificar buildSaleItem — cambiar el shape histórico de los sale items podría romper consumers downstream que asumen la estructura actual, y SaleDetailScreen ya muestra las unit notes correctamente leyendo directamente de units[].

El helper collectNotes implementa lógica de merge: nota global primero, luego notas por unidad con prefijo `U1:`, `U2:` cuando hay múltiples unidades, o sin prefijo cuando hay una sola unidad y no hay nota global. Partes unidas por ` | `.

Aprovechando el commit, se agregó trim a `item.size` y a los nombres de extras en el CSV. En pruebas de device el CSV mostraba "Lata " y "Jalea piña " con espacios trailing — el trim va en salesCsv.js al momento de armar la fila, no en buildSaleItem.

**Lo que requirió iteración:**
- El primer test de collectNotes con trim falló: el caso de prueba tenía 2 units pero esperaba output sin prefijo. Con 2 units, collectNotes correctamente aplica `U1:` prefix. Ajusté el test a 1 unit para probar el trim sin prefix.
- El grep de `backgroundColor.*worker.*color` también mostró CartSheet y ShiftSummaryModal, pero ambos ya usan el patrón role-first correctamente (verificado visualmente).

**Lecciones:**
- El patrón de carry-over perdido es un riesgo real cuando el architect prepara instrucciones pero el focus cambia antes de la ejecución. La regla "Architect carry-over check" codificada en CLAUDE.md previene que esto se repita.
- Las notas en OrderBuilderScreen viven en `units[0].note` porque cada unidad puede tener su propia nota — es un feature, no un bug del modelo. El mismatch está en buildSaleItem que solo lee `cartItem.note` (el campo global). El helper collectNotes es la capa correcta para reconciliar ambos en el momento de exportar sin alterar el modelo de persistencia.
- El trim de strings en el CSV es defensivo y barato — aplicarlo en el punto de salida (CSV generation) es mejor que en el punto de entrada (buildSaleItem) porque no afecta la visualización en pantalla donde los espacios pueden ser intencionales.
