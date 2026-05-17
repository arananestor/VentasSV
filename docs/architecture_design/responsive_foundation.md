# Architecture Design: Responsive Foundation

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-27
- Target branch: feat/responsive-foundation

---

## Problem

Toda la app usa Dimensions.get('window') estático que se calcula una vez y nunca se actualiza. Esto no responde a cambios de orientación ni adapta el layout para tablets. La app se va a usar en teléfonos chicos, medianos, grandes (con y sin notch/cámara frontal), tablets, en vertical y horizontal. Necesitamos infraestructura responsive antes de refactorear pantallas individuales.

Archivos afectados actualmente: POSScreen.js, OrderBuilderScreen.js, SelectWorkerScreen.js, CenterModal.js, productConstants.js — todos usan Dimensions.get estático. Solo OrdersScreen.js usa useWindowDimensions.

---

## Solution

Crear un hook useResponsive que centralice toda la lógica de detección de dispositivo, orientación y cálculo de valores dinámicos. Toda la app consumirá este hook en lugar de Dimensions.get.

---

## Changes

### 1. Crear src/hooks/useResponsive.js

Hook que usa useWindowDimensions (reactivo, se actualiza con rotación) y expone:

- width, height — dimensiones actuales de la ventana
- isTablet — true si el lado más corto del dispositivo es >= 600dp
- isLandscape — true si width > height
- deviceType — 'phone-small' | 'phone' | 'phone-large' | 'tablet'
  - phone-small: width < 360
  - phone: 360-599
  - phone-large: 600-767 (teléfonos grandes en landscape pueden caer acá)
  - tablet: >= 768 en el lado más corto
- columns — cantidad de columnas para grilla de productos:
  - phone portrait: 2
  - phone landscape: 3
  - tablet portrait: 3
  - tablet landscape: 4-5
- gridCardSize — tamaño de card calculado dinámicamente según width, columns, padding y gap
- padding — padding horizontal adaptivo (16 en phone, 24 en tablet)
- gap — gap entre cards (12 en phone, 16 en tablet)
- fontSize — objeto con escalas adaptivas (base, sm, lg, xl)
- layout — 'stack' | 'split' — indica si la pantalla debería usar layout apilado (carrito como modal) o split-view (carrito como panel lateral). Split cuando isTablet && isLandscape.

El hook no usa Dimensions.get — solo useWindowDimensions para ser reactivo.

### 2. Crear src/hooks/useOrientation.js

Hook simple que escucha cambios de orientación y fuerza re-render. Usa useWindowDimensions internamente. Expone orientation: 'portrait' | 'landscape'.

Nota: Si useResponsive ya cubre orientación, este hook puede no ser necesario como archivo separado. Evaluar durante implementación.

### 3. Migrar POSScreen.js como primera pantalla de prueba

- Reemplazar `const { width } = Dimensions.get('window')` con useResponsive
- CARD_SIZE, CARD_GAP, PADDING pasan a ser dinámicos desde el hook
- La grilla usa columns del hook
- NO cambiar funcionalidad ni layout todavía — solo que los valores sean dinámicos
- El layout split-view del carrito se implementará en un PR posterior

### 4. Migrar CenterModal.js

- MAX_H usa height del hook en lugar de Dimensions.get estático
- Así el modal se adapta si cambia la orientación

### 5. Migrar productConstants.js

- ICON_COLS e ICON_BTN_SIZE deben calcularse dinámicamente o recibir width como parámetro

### 6. NO migrar todavía

- OrderBuilderScreen.js, SelectWorkerScreen.js — se migran en sus PRs propios
- OrdersScreen.js — ya usa useWindowDimensions, se unificará después

---

## Rules

1. useResponsive es la ÚNICA fuente de verdad para dimensiones y breakpoints
2. Ningún archivo nuevo debe usar Dimensions.get('window') — siempre useResponsive
3. Los archivos existentes se migran gradualmente, un PR por pantalla
4. El hook debe funcionar sin errores en teléfono y tablet, portrait y landscape
5. SafeAreaView sigue siendo obligatorio en todas las pantallas (maneja notch/cámara)
6. Tests 0 fallos obligatorio
7. Valores de breakpoints basados en estándares de la industria: Material Design usa 600dp para tablet, 840dp para tablet grande

---

## Verification

1. En teléfono vertical: grilla de 2 columnas, cards bien proporcionadas
2. En teléfono horizontal: grilla de 3 columnas, se adapta sin overflow
3. En tablet vertical: grilla de 3 columnas, padding más generoso
4. En tablet horizontal: grilla de 4+ columnas
5. Rotar el dispositivo actualiza el layout instantáneamente sin flicker
6. CenterModal se adapta al tamaño de ventana actual
7. npm test pasa con 0 fallos
