# Feature Retro: CLAUDE.md Sync Post Polish Phase

- **Date:** 2026-05-17
- **PR:** docs/sync-claude-md-post-polish
- **Design doc:** none (housekeeping documental, ver regla "Design doc decision rule" agregada en este mismo PR)

## Resumen

CLAUDE.md estaba desactualizado tras la polish phase (PRs #59–#72). Las prioridades mezclaban items completados con pendientes sin distinción clara, no existían reglas para los patrones establecidos durante el polish (Pressable backdrops, useResponsive, showNotif), y la sección de arquitectura no documentaba los componentes reutilizables creados.

Este PR alinea CLAUDE.md con la realidad actual de develop e introduce dos reglas operativas: la cadencia de release (cada 10 PRs) y la regla de cuándo se requiere un design doc separado vs. un PR con descripción rica.

## Cambios

- **Current Priority** — Reescrita completamente. Separada en "Active priorities" (8 items numerados) y "Completed milestones" (5 bloques temáticos con PRs referenciados). Legible de un vistazo.
- **Process Rules** — 5 reglas nuevas agregadas: design doc decision rule, release cadence, polish phase patterns obligatorios, animation restrictions en ScrollView, react-native-reanimated bloqueado.
- **Architecture** — Nuevo subbloque "Established Architecture Patterns" con 5 bullets: useResponsive, modal backdrops, BottomSheetModal, IconColorPicker, user feedback API.
- **Testing/Commands** — Verificado: 760 tests, 52 suites coincide con disco. Sin cambios necesarios.

## Qué funcionó

- Separar Active priorities de Completed milestones hace la sección legible de un vistazo — el lector sabe inmediatamente qué queda por hacer sin filtrar mentalmente los items tachados.
- Codificar la regla del design doc evita que cambios chicos arrastren ceremonia innecesaria (design doc + review + merge separado) cuando un PR con descripción rica es suficiente.

## Lecciones

- CLAUDE.md acumula deuda silenciosa cuando los PRs no actualizan el documento incrementalmente. La regla "CLAUDE.md must be verified on every PR" ya existía desde PR #11 pero claramente no se estaba cumpliendo durante la polish phase — 13 PRs sin actualizar prioridades.
- De aquí en adelante cada execution PR debe tocar CLAUDE.md si el conteo de tests, la lista de prioridades, o los patrones establecidos cambian. No se trata de agregar burocracia sino de mantener el contexto confiable para la próxima sesión de Claude Code.
