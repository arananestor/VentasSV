# Feature Retro: POSScreen Collapsible Header

- **Date:** 2026-04-29
- **PR:** feat/pos-collapsible-header
- **Design doc:** docs/architecture_design/pos_screen_redesign.md

## Resumen

Header colapsable en POSScreen que responde al scroll de productos. Al hacer scroll hacia abajo, la tab bar y el indicador de modo expandido se ocultan suavemente, y aparece un indicador de modo compacto (mini-bar) inline con el nombre del worker. Al hacer scroll hacia arriba, el header se expande de nuevo. Threshold de 50px para respuesta inmediata.

## Cambios

- **src/utils/collapsibleHeader.js** (nuevo) — Constantes exportadas: COLLAPSE_THRESHOLD (50), TAB_BAR_HEIGHT (48), TAB_BAR_MARGIN (6). Función getInterpolationConfigs() retorna 5 configuraciones de interpolación para Animated.interpolate: tabBarOpacity, tabBarHeight, tabBarMargin, expandedSectionOpacity, miniModeOpacity.
- **src/screens/POSScreen.js** — ScrollView de productos cambiado a Animated.ScrollView con onScroll vinculado a Animated.event (useNativeDriver: false). scrollY useRef(new Animated.Value(0)). Tab bar wrapper cambiado a Animated.View con height/opacity/marginBottom animados. Mode indicator expandido envuelto en Animated.View con opacity animada. Mini mode indicator agregado al headerLeft con opacity inversa. Tab hint cambiado a Animated.Text con opacity animada. Import de ScrollView eliminado (ya no se usa directamente). Estilos nuevos: miniMode, miniModeText. tabBarWrapper simplificado a solo overflow: hidden (height/margin ahora animados).
- **__tests__/unit/collapsibleHeader.test.js** (nuevo) — 12 tests: constantes, todas las configs, extrapolation clamp, output ranges, inversión miniMode/expandedSection.
- **CLAUDE.md** — Actualizado a 743 tests, 51 suites. Suite collapsibleHeader agregada a la lista.

## Qué funcionó

- Extraer la configuración de interpolaciones a un utility puro permite testing sin componentes React
- useNativeDriver: false es necesario para height/opacity pero el threshold bajo (50px) y scrollEventThrottle (16) mantienen la animación fluida
- Dos indicadores de modo (expanded + mini) con opacidades inversas da transición visual limpia sin repositionamiento

## Lecciones

- No se puede animar height con useNativeDriver: true en React Native — solo transform y opacity lo soportan. Para height hay que usar useNativeDriver: false, lo cual funciona bien en scrollEventThrottle: 16
- El tab bar horizontal necesita Animated.ScrollView (no ScrollView regular) cuando está dentro de un Animated.View con height animada, para que el layout se recalcule correctamente
- overflow: hidden en tabBarWrapper es crucial para que la tab bar no se desborde cuando height va a 0
