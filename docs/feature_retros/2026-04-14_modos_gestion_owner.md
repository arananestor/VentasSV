# Feature Retro: Owner Can Manage Modes and Schedule Activations

- **Date:** 2026-04-14
- **PR:** #38

## Resumen

El owner ahora gestiona Modos localmente desde ProfileStack: crear, editar overrides por producto, editar tabOrder, clonar, activar, eliminar, y programar activaciones locales. Las capacidades distribuidas (control remoto, delegación a co-admin, panel multi-dispositivo) muestran UpsellCard hasta que Qentas esté conectado.

## Cambios por archivo

- **src/utils/modeManagement.js** — canManageModesLocally, validateModeForm, buildOverridesPatch, reorderTabOrder
- **src/utils/modeScheduling.js** — evaluateSchedule, appendScheduledActivation, removeScheduledActivation, isScheduleValid
- **src/screens/ManageModesScreen.js** — lista de Modos, crear, activar, clonar, eliminar (todo con CenterModal)
- **src/screens/ModeEditorScreen.js** — editor con toggles de productos, price override, tabOrder con up/down, scheduled activations
- **App.js** — ManageModes y ModeEditor en ProfileStack
- **src/screens/ProfileScreen.js** — item "Gestión de Modos" para owner
- **src/context/AppContext.js** — useEffect scheduling timer (60s) + evaluateSchedule import

## Qué funcionó

- Todas las confirmaciones usan CenterModal (cero Alert nativa)
- buildOverridesPatch normaliza edge cases (NaN, '', null) de forma centralizada
- evaluateSchedule resuelve ambigüedad con la entry más reciente
- UpsellCards dentro de RequiresQentas proveen una visión clara de qué viene con Qentas

## Qué ajustaríamos

- Los date-time inputs son ISO strings planos — funcional pero no amigable. Un date picker visual mejoraría mucho la UX de scheduling
- La pantalla ModeEditorScreen es larga — podría separarse en tabs internas (overrides, tabOrder, schedule) en una iteración futura

## Limitaciones conocidas

- priceOverride solo aplica a productos de un size (documentado en design doc)
- Delegación a co-admin pendiente de Qentas (gated con UpsellCard)
- Scheduling solo corre con la app abierta (timer local); scheduling server-side requiere Qentas

## Próximos pasos

- Onboarding del owner con configuración de Modos
- Dashboard de Modos activos por dispositivo cuando Qentas esté conectado
- Date picker visual para scheduled activations
