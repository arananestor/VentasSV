# Feature Retro: Fix Remaining UX Bugs

- **Date:** 2026-04-26
- **PR:** fix/remaining-ux-bugs

## Resumen

Tres bugs de UX que sobrevivieron PRs anteriores: CenterModal con Pressable sibling pattern, TimeWheelPicker con PanResponder propio, avatar del owner theme-aware en ManageModes y ModeEditor. Se corrigió el retro anterior y se agregó regla de retros vivos a CLAUDE.md.

## Cambios

- **CenterModal.js** — ambos TouchableWithoutFeedback eliminados. Pressable con absoluteFill como hermano del card captura taps de overlay. Card queda libre para scroll.
- **TimeWheelPicker.js** — ScrollView reemplazado por PanResponder que detecta swipes verticales, calcula item por distancia, anima con Animated.spring. No compite con ScrollView padre.
- **ManageModesScreen.js** — burbuja de worker sin foto: owner usa theme.accent bg + theme.accentText texto.
- **ModeEditorScreen.js** — misma lógica en lista de empleados del editor.
- **2026-04-21_catalogos_ux_fixes.md** — corregido con sección "Issues pendientes post-merge".
- **CLAUDE.md** — regla de retros vivos en Documentation y Process Rules.

## Qué funcionó

- Pressable sibling es el patrón definitivo para overlay dismiss sin interferir scroll
- PanResponder para el time picker evita dependencia de react-native-gesture-handler

## Lecciones

- Los cambios no commiteados se pierden al cambiar de branch. Siempre commitear antes de cambiar, aunque sea un commit temporal.
- Los retros deben corregirse cuando se descubre que algo reportado como resuelto no lo estaba.
