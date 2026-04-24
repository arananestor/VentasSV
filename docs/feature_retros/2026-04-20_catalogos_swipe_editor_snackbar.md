# Feature Retro: Catálogos — Swipe, Editor, Snackbar

- **Date:** 2026-04-20
- **PR:** fix/catalogos-swipe-editor-snackbar (merged to develop)

## Resumen

Fix batch para catálogos: swipe unidireccional con PanResponder sin closure stale, color de fondo sincronizado con prop isActive, navegación AddProduct agregada a ProfileStack, CenterModal hecho scrollable con maxHeight 80%, product editor modal expandido con ingredientes y extras, sistema de notificaciones showNotif separado de showSnack.

## Cambios por archivo

- **ModeEditorScreen.js** — SwipeRow reescrito: activeRef + toggleRef para PanResponder, dx > 0 unidireccional, isActive directo en JSX para color sync. Product editor modal con nombre, precios por tamaño, ingredientes (add/remove), extras con precio (add/remove). Botón "Agregar producto" navega a AddProduct.
- **ManageModesScreen.js** — Círculo punteado placeholder eliminado de worker bubbles. showNotif reemplaza showSnack para acciones de catálogo.
- **App.js** — AddProduct agregado como Screen en ProfileStack para resolver crash de navegación desde ModeEditor.
- **CenterModal.js** — View interno reemplazado con ScrollView, maxHeight 80% viewport, nestedScrollEnabled, keyboardShouldPersistTaps handled.
- **AppContext.js** — Sistema showNotif agregado: notificación compacta, posición top, auto-hide 1500ms, sin botones de acción. Independiente de showSnack (ventas).

## Qué funcionó

- Separar showNotif de showSnack eliminó el problema de botones print/WhatsApp apareciendo en acciones no relacionadas a ventas
- El patrón activeRef + toggleRef resuelve definitivamente el closure stale de PanResponder
- Agregar AddProduct a ProfileStack fue un fix directo sin efectos colaterales

## Qué ajustaríamos

- El PR se mergeó con el botón "Activar" todavía presente — debió removerse antes del merge
- Avatar del owner sigue con fallback theme.accent en vez de color oscuro — bug visual pendiente
- Product editor modal funcional pero incompleto: falta color picker para ingredientes, icon picker, image picker, y awareness de tipo simple vs elaborado
- Estos 3 pendientes requieren un fix/ PR adicional

## Lecciones

- **Revisar Files changed exhaustivamente antes de mergear.** Si algo quedó pendiente, se pushea otro commit al mismo branch antes del merge. Después del merge ya no se puede corregir el PR — toca crear uno nuevo.
- **El retro debe crearse ANTES del merge o inmediatamente después.** Nunca debe faltar.
