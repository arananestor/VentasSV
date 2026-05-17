# Architecture Design: Fix Remaining UX Bugs

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-26
- Target branch: fix/remaining-ux-bugs

---

## Problem

El PR fix/catalogos-ux-fixes se mergeó pero dejó 3 bugs sin resolver. Después se dieron instrucciones adicionales para arreglarlos pero esos cambios nunca se commitearon — se perdieron al cambiar de branch para pos-focus-lockdown.

Bugs actuales:
1. CenterModal: el outer TouchableWithoutFeedback sigue interceptando gestos táctiles. Solo se reemplazó el inner. El scroll no funciona al tocar áreas vacías.
2. TimeWheelPicker: usa ScrollView de react-native que no maneja bien scroll anidado vertical-vertical. El reloj no gira.
3. Avatar del owner en ManageModesScreen y ModeEditorScreen: no tienen el check role === 'owner' para usar theme.accent/theme.accentText. Solo ProfileScreen lo tiene.

---

## Solution

Tres fixes puntuales en tres archivos. Además, corregir el retro existente para que refleje la realidad.

---

## Changes

### 1. Fix CenterModal.js — eliminar outer TouchableWithoutFeedback
- Quitar ambos TouchableWithoutFeedback (outer e inner)
- Usar Pressable con StyleSheet.absoluteFill como hermano del card (no como padre)
- El Pressable se renderiza primero (z-index bajo), atrapa taps en overlay para cerrar
- El card se renderiza después (z-index alto), queda encima
- ScrollView dentro del card no tiene ningún padre compitiendo por gestos
- Agregar Pressable al import de react-native, quitar TouchableWithoutFeedback

### 2. Fix TimeWheelPicker.js — ScrollView de gesture-handler
- Importar ScrollView desde react-native-gesture-handler en lugar de react-native
- El ScrollView de gesture-handler maneja correctamente scroll anidado en la misma dirección
- Todo lo demás del componente queda igual

### 3. Fix avatar del owner en ManageModesScreen.js y ModeEditorScreen.js
- En ManageModesScreen, donde se renderea la burbuja del worker sin foto: si worker.role === 'owner', backgroundColor = theme.accent y color del texto = theme.accentText. Si no es owner, worker.color y '#fff'.
- En ModeEditorScreen, misma lógica en la lista de empleados del editor.
- Patrón idéntico al que ya existe en ProfileScreen.

### 4. Corregir retro existente
- Actualizar docs/feature_retros/2026-04-21_catalogos_ux_fixes.md para que refleje que los fixes 1, 2 y 3 NO quedaron resueltos en ese PR. Agregar sección "Issues pendientes" explicando qué falló y por qué.

### 5. Nueva regla en CLAUDE.md — retros vivos
- En la sección "Documentation — Mandatory", agregar la regla: retros son documentos vivos que se actualizan con cada PR que toque el mismo área. Si un fix posterior revela que algo del retro era incorrecto, el retro se corrige. Nunca dejar un retro con información falsa.
- En la sección "Process Rules — Learned from Retros", agregar: "Retros must reflect reality: if a subsequent PR reveals a retro claimed something was fixed but wasn't, the retro must be corrected in that same PR. Retros are living documents, not static snapshots."

---

## Rules

1. Solo se tocan los archivos listados — nada más
2. Todos los colores de ThemeContext, sin valores hardcoded
3. El patrón de avatar del owner debe ser idéntico en las 3 pantallas
4. Tests 0 fallos obligatorio

---

## Verification

1. CenterModal: scroll funciona tocando en cualquier parte dentro del modal
2. TimeWheelPicker: las ruedas de hora y minuto giran al deslizar
3. Avatar del owner en ManageModesScreen: visible y legible en ambos temas
4. Avatar del owner en ModeEditorScreen: visible y legible en ambos temas
5. Retro anterior corregido con la verdad de lo que pasó
6. CLAUDE.md tiene la nueva regla de retros vivos
7. npm test pasa con 0 fallos
