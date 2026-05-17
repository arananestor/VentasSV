# Feature Retro: POS Focus Lockdown

- **Date:** 2026-04-23
- **PR:** refactor/pos-focus-lockdown

## Resumen

Bloqueo visual de funciones no-POS: tab Comandas muestra placeholder, sección EQUIPO en ProfileScreen reemplazada por placeholder, botón ManageTabs oculto. Nada borrado, solo desconectado visualmente.

## Cambios

- **App.js** — componente ComandasPlaceholder con ícono + "PRÓXIMAMENTE". Tab Comandas apunta a ese componente en vez de OrdersScreen. Import de OrdersScreen preservado.
- **ProfileScreen.js** — sección EQUIPO (worker cards + agregar empleado) reemplazada por card con ícono users + "PRÓXIMAMENTE". Estados y modales de workers permanecen en el código.
- **POSScreen.js** — botón "Pestañas" (ManageTabs) comentado. Ruta ManageTabs permanece en el navigator.

## Qué funcionó

- Enfoque limpio: 3 cambios puntuales, sin borrar código, sin romper tests
- ComingSoonPlaceholder como componente reutilizable en App.js

## Lecciones

- Bloquear visualmente es más seguro que borrar — cuando se reactive, solo se revierte el placeholder
