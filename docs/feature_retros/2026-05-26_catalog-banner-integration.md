# Feature Retro: Catalog Banner Integration

- **Date:** 2026-05-26
- **PR:** feature/catalog-banner-integration (PR #87)
- **Design doc:** docs/architecture_design/catalog_system_redesign.md (Phases 6-8, banner integration subset)

## Resumen

Último PR del rediseño de catálogos. CatalogActiveBanner y CatalogSwitcherSheet integrados en POSScreen, OrdersScreen, SalesScreen. El banner muestra "VENDIENDO AHORA" con countdown cuando un catálogo no-Principal está activo. Tap en el banner abre CatalogSwitcherSheet para cambiar de catálogo instantáneamente. CLAUDE.md actualizado: catalog redesign movido a Completed milestones, referencias a ModeEditorScreen eliminadas.

## Cambios

- **src/components/CatalogSwitcherSheet.js** (nuevo) — BottomSheetModal con lista de modes. Cada row: barra de color + nombre + badges PRINCIPAL/ACTIVO. Tap en mode no-activo llama onSelect. Props: visible, onClose, modes, currentModeId, onSelect.
- **src/screens/POSScreen.js** — Import CatalogActiveBanner + CatalogSwitcherSheet. State showSwitcher. allScheduledActivations computed. Banner renderizado antes del mini header. Sheet al final del JSX. onSelect cambia mode con notif.
- **src/screens/OrdersScreen.js** — Mismo patrón. Banner arriba del header. Sheet después de los modales existentes.
- **src/screens/SalesScreen.js** — Mismo patrón. Banner arriba del ScreenHeader. Sheet al final.
- **CLAUDE.md** — Catalog UI components bullet actualizado (CatalogActiveBanner consumed, ModeEditorScreen deleted noted). Referencias a ModeEditorScreen eliminadas (modal backdrops, photo picker). Active priorities: catalog redesign item eliminado. Completed milestones: línea completa del redesign (PRs #83-#87).

## Qué funcionó

- CatalogSwitcherSheet es 60 líneas simples — BottomSheetModal con lista de rows tappables. Sin lógica compleja.
- La integración en las 3 screens fue mecánica: import, state, compute allScheduledActivations, render banner arriba, render sheet al final, onSelect callback idéntico. Copy-paste justificado por ser 3 consumidores con el mismo patrón trivial (no vale extraer a un hook custom por tan poco).
- POSScreen tiene el header colapsable con absolute positioning — el banner se renderiza ANTES del mini header, dentro del SafeAreaView normal flow. Funciona sin ajustar el spacing del header porque el banner está en flow normal y el header es absolute. El banner empuja el contenido hacia abajo visualmente, y el header absolute flota encima sin conflicto.

## Lecciones

- La preocupación del architect sobre conflictos de spacing entre banner y header colapsable en POSScreen resultó ser un no-issue. El banner está en flow normal, el header es absolute, el ScrollView tiene paddingTop basado en headerHeight medido con onLayout. El banner no afecta headerHeight porque está fuera del header medido. Si el banner aparece/desaparece, el layout se ajusta solo.
- Limpiar las referencias a ModeEditorScreen en CLAUDE.md reveló 4 menciones stale (modal backdrops, photo picker migration, active priorities, catalog UI components). La auditoría de CLAUDE.md del PR #82 no las atrapó porque ModeEditorScreen no se había eliminado todavía. Las auditorías deben ser incrementales: cada PR que elimina un archivo debe grep CLAUDE.md por su nombre.
- Este PR cierra el rediseño de catálogos que se extendió a 5 PRs (#83-#87) en lugar de los 3 originales (#83-#85). El split fue correcto: cada PR es revisable independientemente y ninguno tiene más de 5 archivos tocados.
