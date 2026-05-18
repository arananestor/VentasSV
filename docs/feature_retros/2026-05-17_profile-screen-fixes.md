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
