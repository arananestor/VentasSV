# Feature Retro: CLAUDE.md Audit

- **Date:** 2026-05-25
- **PR:** docs/claude-md-audit
- **Design doc:** none (housekeeping documental)

## Resumen

Auditoría de duplicaciones en CLAUDE.md y reorganización estructural. Se eliminó la sección "Development Rules — No Exceptions" (12 bullets, 10 duplicados en otras secciones), se reclasificó el bloqueo de react-native-reanimated de Process Rules a Stack (donde pertenece como constraint técnico), se limpió Active priorities eliminando la regla de cadencia que ya vive en Process Rules, y se convirtieron los prefijos bold de la sección Architecture a H3 headers para escaneabilidad.

## Cambios

- **CLAUDE.md** — Eliminada sección "Development Rules — No Exceptions" (10 bullets duplicados, 2 únicos movidos a UI Conventions). Bullet "react-native-reanimated is blocked" movido de Process Rules a Stack como "**BLOCKED:**". Active priorities: eliminado item 1 (Release cadence, duplicado de Process Rules), agregado item 8 (Catalog system redesign execution con PRs #83-#85). Architecture: 7 subsecciones convertidas de bold paragraph prefix a H3 headers.
- **docs/feature_retros/2026-05-25_claude-md-audit.md** — este archivo.

## Qué funcionó

- La auditoría bullet-por-bullet de Dev Rules fue exhaustiva: cada uno de los 12 bullets se mapeó a su ubicación original más detallada. Ninguno era realmente "único" en espíritu — solo 2 carecían de duplicado textual exacto (KeyboardAvoidingView y Pills/cards), y ambos son convenciones de UI, no reglas de desarrollo.
- La conversión a H3 fue mecánica y directa — el contenido no cambió, solo el formato del header. No se descubrieron inconsistencias de orden entre subsecciones.
- La reclasificación de reanimated de "Process Rules" a "Stack" refleja la realidad: no es una lección aprendida de un retro, es un constraint técnico del stack actual. El wording "BLOCKED:" alinea con el patrón existente de @testing-library.

## Lecciones

- CLAUDE.md acumula duplicaciones cuando cada PR agrega bullets defensivamente ("mejor repetirlo que que falte"). La sección Dev Rules fue el peor caso: creada temprano en el proyecto cuando las otras secciones no existían, nunca auditada después. 10 de 12 bullets decían lo mismo que otra sección con más contexto.
- La regla existente "CLAUDE.md must be verified on every PR" dice "update test counts, suite lists, and priority status if they have changed" — captura drift de datos pero no duplicación de reglas. Una auditoría periódica como esta (cada ~20 PRs, alineada con engineering:tech-debt del skills mapping) es más apropiada que cambiar el wording de esa regla. La duplicación crece despacio y solo se ve en una lectura completa, no en verificación incremental.
- Los H3 headers hacen la sección Architecture escaeneable en el sidebar de cualquier viewer markdown. Es un cambio cosmético con impacto real en usabilidad — antes, llegar a "Auth Rules" requería scrollear o buscar. Ahora el outline del documento lo muestra directo.
