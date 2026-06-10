# Feature Retro: Production Readiness Fixes

- **Date:** 2026-04-27
- **Branch:** fix/production-readiness
- **Design doc:** N/A (audit-driven fixes)

## Resumen

Auditoría de producción del repo completo. Se encontraron 2 categorías de issues: (1) archivo .env con API key de Google Maps trackeado en git, (2) 5 console.log en código de producción. Todos resueltos en un solo PR.

## Cambios

- **.gitignore** — Agregado `.env` antes de `.env*.local`. El patrón `.env*.local` no cubría `.env` sin sufijo.
- **.env** — Removido del tracking con `git rm --cached`. El archivo permanece localmente pero ya no se commitea.
- **src/context/AppContext.js** — línea 107: `console.log('Error loading data', e)` → `/* silent — data will use defaults */`
- **src/context/AuthContext.js** — línea 48: `console.log('Auth load error', e)` → eliminado (el catch ya maneja con `setIsSetup(false)`)
- **src/context/TabContext.js** — línea 42: `console.log('Tab load error', e)` → `/* silent — tabs will use defaults */`
- **src/utils/ticketPrinter.js** — líneas 237, 252: `console.log('Print error:', e)` y `console.log('Share error:', e)` eliminados. Los errores ya se retornan como `{ error: e.message }` al caller.

## Qué funcionó

- El grep exhaustivo `console.log` sobre `src/` confirmó que solo había 5 instancias y todas eran catch blocks que ya tenían manejo de error (defaults o return de error object). Ninguno necesitaba logging alternativo.
- La separación de .env en .gitignore fue quirúrgica: solo agregar `.env` como línea independiente, ya que `.env*.local` usa globbing que no matchea `.env` sin sufijo.

## Lecciones

- El `.env` llevaba trackeado desde el inicio del proyecto — nunca se verificó que `.gitignore` lo cubriera. Lección: al crear un proyecto con API keys, verificar que `.gitignore` cubra `.env` exacto, no solo variantes con sufijo.
- Los console.log en catch blocks son fáciles de dejar durante desarrollo y olvidar antes de producción. Los 5 estaban en funciones de carga (loadAuth, loadData, loadTabs) y operaciones de usuario (print, share) — exactamente donde un dev agrega logging temporal.
- `console.warn` en scheduledActivationNormalizer.js se mantuvo intencionalmente — es una advertencia legítima para shapes no reconocidas durante migración, no un log de debug.

## Test count

882 tests, 60 suites, 0 failures. Sin cambios en conteo (las ediciones fueron solo remoción de console.log en catch blocks).
