# Feature Retro: Catalog Gestures + ModeEditor Deletion

- **Date:** 2026-05-26
- **PR:** feature/catalog-gestures (PR #86)
- **Design doc:** docs/architecture_design/catalog_system_redesign.md (Phases 6-8, gesture integration subset)

## Resumen

Tres cambios enfocados: fix del bug cross-day countdown en CatalogActiveBanner, refactor de ManageModesScreen reemplazando ActionPills con PanResponder swipe gestures (tap→CatalogDetail, swipe right→duplicate, swipe left→delete modal, long press→activate modal), y eliminación de ModeEditorScreen + 3 archivos huérfanos (productEditorLogic.js, modeEditorLogic.test.js, modeProductEditorLogic.test.js).

## Cambios

- **src/components/CatalogActiveBanner.js** — findActiveActivationCountdown exportada + fix: `r.endMin - nowMin` directo en lugar de la reducción incorrecta que colapsaba cross-day endMin.
- **src/screens/ManageModesScreen.js** — Reescrito. ActionPill eliminado. SwipeableCatalogCard inline (~90 líneas) con PanResponder: translateX animado, reveal backgrounds (verde copy / rojo trash-2), threshold 60%, Animated.spring para cancelación. Tap → navigate('CatalogDetail'). Long press 700ms → modal ACTIVAR AHORA. CenterModal nuevo para tipo 'activate'. Badge "Default" renombrado a "Principal" + badge "Activo" agregado.
- **src/screens/ModeEditorScreen.js** — ELIMINADO (585 líneas).
- **src/utils/productEditorLogic.js** — ELIMINADO (huérfano, solo consumido por ModeEditorScreen).
- **__tests__/unit/modes/modeEditorLogic.test.js** — ELIMINADO (testeaba buildOverridesPatch que quedó como dead code en modeManagement).
- **__tests__/unit/modes/modeProductEditorLogic.test.js** — ELIMINADO (testeaba cycleColor de productEditorLogic eliminado).
- **__tests__/unit/catalogActiveBanner.test.js** — +2 tests: cross-day primary range (60min), cross-day overflow range (30min).
- **App.js** — ModeEditor import + Stack.Screen eliminados.
- **CLAUDE.md** — 857 tests, 58 suites (-19 tests, -2 suites por archivos eliminados). Regla "Architect scope pre-flight check" codificada.

## Qué funcionó

- El SwipeableCatalogCard quedó en 90 líneas inline, debajo del umbral de 120 para extraer a componente separado. PanResponder con useNativeDriver: true para translateX funciona fluido sin reanimated. El patrón de OrdersScreen (threshold + Animated.timing para commit, Animated.spring para cancel) se trasladó directamente.
- La combinación de TouchableWithoutFeedback (para tap/long-press) envuelto dentro de la Animated.View con PanResponder fue el truco clave: PanResponder captura solo movimiento horizontal >10px, dejando tap y long-press para TouchableWithoutFeedback. Sin conflicto de gestos.
- El long-press de 700ms se implementó con setTimeout en PressIn + clearTimeout en PressOut. didLongPress ref previene que el tap se dispare después de un long press completado.
- Eliminar ModeEditorScreen fue limpio: grep confirmó que solo ModeEditorScreen importaba productEditorLogic y solo los test files testeaban esos utils. findModeForWorker sigue siendo consumida por AppContext (modeAutoActivation.test.js se mantiene).

## Lecciones

- **Cross-day countdown bug**: La línea `r.endMin > 24*60 ? r.endMin - 24*60 : r.endMin` era incorrecta. expandToRanges para cross-day devuelve range day=N con endMin=1440 (midnight) y range day=N+1 con endMin=rawEndMin. En ambos casos, `r.endMin - nowMin` da el countdown correcto (60min para range del primer día, 30min para range del segundo). La reducción a `< 24*60` colapsaba el cálculo incorrectamente.
- **Architect scope pre-flight check**: Los PRs #82, #85 y #86 originales fueron todos dimensionados demasiado grandes por el architect y requirieron splits mid-flight. La regla codificada (>5 new files OR >8 existing files OR >3 layers = split obligatorio) hubiera prevenido los 3 casos. El costo del split es bajo (2 PRs en lugar de 1); el costo del no-split es alto (flags de Code, re-work, PRs abandonados).
- **modeManagement.js conserva dead code**: buildOverridesPatch y reorderTabOrder ya no se consumen después de eliminar ModeEditorScreen. Dejé el archivo intacto porque canManageModesLocally, validateModeForm, y findModeForWorker SÍ se consumen. Limpiar las funciones muertas es housekeeping menor para un PR futuro.
