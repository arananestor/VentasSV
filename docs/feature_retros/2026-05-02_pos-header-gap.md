# Feature Retro: POSScreen Header Gap Fix

- **Date:** 2026-05-02
- **PR:** fix/pos-header-gap
- **Design doc:** docs/architecture_design/add_product_redesign.md

## Resumen

Se revirtieron los estilos del PR fix/pos-header-slim y se reimplementó el header colapsable del POSScreen usando position absolute + Animated.diffClamp + translateY con useNativeDriver: true. El resultado es scroll 100% fluido, 0 jitter, compatible con native driver. Se llegó a esta solución después de 5 intentos fallidos.

## Por qué se revirtió fix/pos-header-slim

El PR fix/pos-header-slim modificó estilos que no se pidieron (paddingTop, paddingBottom, fontSize del workerName, tamaño del statusDot, dimensiones del tabPill, TAB_BAR_HEIGHT, TAB_BAR_MARGIN). Se revirtieron todos estos valores a los originales pre-slim.

## Intentos fallidos

### 1. Animar height y margin del modeIndicator y tabHint con interpolaciones

Se agregaron 4 nuevas interpolaciones (modeIndicatorHeight, modeIndicatorMargin, tabHintHeight, tabHintMargin) con useNativeDriver: false, aplicadas directamente al Animated.View del modeIndicator (que tenía borderWidth, borderRadius, paddingVertical). Resultado: layout thrashing violento — la pantalla temblaba/shakeaba al hacer scroll. Cada frame del scroll recalculaba el layout de múltiples elementos con height animado, compitiendo con el Animated.ScrollView.

### 2. Wrapper con overflow hidden y height animado

Se separó el height animado a un wrapper Animated.View externo (solo overflow: hidden + height/margin animados) y se dejó el elemento interior con borders/padding natural. Mismo patrón que tabBarWrapper. Resultado: mismo jitter severo. El problema no era el border/padding conflicto — era que cualquier height animado adicional sobre elementos que afectan el layout del ScrollView causa re-layout cada frame con useNativeDriver: false.

### 3. Opacity sin height, useNativeDriver: true

Se eliminaron todas las animaciones de height/margin. Solo opacity (fadeOut/fadeIn) con useNativeDriver: true. El scroll era fluido pero dejaba un gap grande donde el modeIndicator y tabHint se volvían invisibles pero seguían ocupando espacio. Visualmente inaceptable.

### 4. Migración a react-native-reanimated

react-native-reanimated v4.1.1 estaba en package.json como dependencia. Se migró POSScreen a useSharedValue + useAnimatedScrollHandler + useAnimatedStyle + interpolate de reanimated (todo en UI thread). Se creó babel.config.js con el plugin, mock para jest, se actualizó transformIgnorePatterns. Resultado: jest falló porque babel-preset-expo no era dependencia directa. Al resolver eso, la app crasheó con error "installTurboModule called with 1 arguments" — reanimated v4 requiere configuración nativa completa (babel plugin compilado, rebuild nativo) que no estaba en el proyecto. Se desinstaló completamente con npm uninstall, se eliminaron babel.config.js, mock, y todas las referencias.

### 5. Vuelta a RN Animated, solo opacity + useNativeDriver: true

Después de desinstalar reanimated, se volvió a RN Animated con solo opacity (fadeOut/fadeIn) y useNativeDriver: true. Scroll perfectamente fluido pero el gap persistía — los elementos invisibles seguían ocupando espacio vertical.

## Solución final: header absoluto con diffClamp + translateY

Patrón de header absoluto — el mismo que usan Instagram, Spotify y apps de producción en RN:

- **Full header** (position: absolute, top: 0, left: 0, right: 0, zIndex: 10): contiene worker name, mode indicator, tab bar, tab hint. Tiene backgroundColor del theme para cubrir el contenido debajo.
- **Mini header** (position: absolute, top: 0, left: 0, right: 0, zIndex: 20): worker name compacto + dot + mini mode indicator. Opacity fadeIn cuando el full header está 60-100% oculto.
- **Animated.diffClamp(scrollY, 0, headerHeight)**: controla el translateY del full header. Scroll down = header se desliza hacia arriba. Scroll up = header reaparece. El diffClamp acumula deltas del scroll y los clampa entre 0 y headerHeight.
- **headerHeight medido con onLayout**: una sola medición via useRef guard para evitar re-renders. El ScrollView usa paddingTop = headerHeight + 4 para dejar espacio.
- **useNativeDriver: true en TODO**: Animated.event del onScroll, translateY del header, opacity del mini header. Solo transform y opacity — cero propiedades de layout animadas.

## Cambios

- **src/screens/POSScreen.js** — Layout del header reescrito completamente. Full header con position absolute + translateY animado via diffClamp. Mini header separado con opacity fadeIn. ScrollView con paddingTop dinámico basado en headerHeight medido. Import de collapsibleHeader reducido (POSScreen ya no usa getInterpolationConfigs). Estilos nuevos: fullHeader, headerRow, miniHeader, miniDot, miniName. Estilos del header-slim revertidos a valores originales.
- **src/utils/collapsibleHeader.js** — TAB_BAR_HEIGHT revertido a 48, TAB_BAR_MARGIN a 6. getInterpolationConfigs() se mantiene para referencia y tests pero POSScreen ya no lo consume.
- **__tests__/unit/collapsibleHeader.test.js** — Assertions revertidas a valores originales (48, 6).
- **package.json** — react-native-reanimated eliminado de dependencies. transformIgnorePatterns limpio (sin reanimated).
- **package-lock.json** — Actualizado por npm uninstall de reanimated.

## Lecciones

- **NUNCA animar height/margin/padding en elementos que afecten el layout de un ScrollView.** useNativeDriver: false procesa en JS thread y causa re-layout cada frame = jitter garantizado. Solo transform y opacity son compatibles con useNativeDriver: true.
- **No instalar dependencias nativas sin verificar la configuración completa.** react-native-reanimated requiere babel plugin compilado y rebuild nativo. Agregar el paquete sin la configuración completa rompe la app en runtime.
- **El patrón de header absoluto con diffClamp + translateY es el estándar de producción** para headers colapsables en RN sin reanimated. position absolute saca el header del flow de layout, translateY lo mueve sin re-layout, paddingTop en el ScrollView deja el espacio.
- **onLayout + useRef guard** es el patrón correcto para medir elementos una sola vez sin causar re-renders infinitos. El default de 120px funciona bien como fallback antes de la primera medición.
- **Animated.diffClamp** es clave para el comportamiento bidireccional (scroll down = oculta, scroll up = muestra). Sin diffClamp, el header solo respondería a la posición absoluta del scroll, no a la dirección.
