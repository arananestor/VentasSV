# Architecture Design: Modos de Operación

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-14
- Target branch: feature/modos-de-operacion (ejecución en múltiples PRs)

---

## Problem

Hoy VentasSV asume un único contexto operativo: el negocio vende siempre los mismos productos, con los mismos precios, en el mismo orden de pestañas. Esto no refleja la realidad de un dueño en El Salvador, que opera en contextos distintos a lo largo de la semana: local principal, festival del mango, feria gastronómica, eventos puntuales. En cada contexto cambia qué se vende, a qué precio y cómo se organiza, pero el dueño no tiene forma de separar esa configuración sin duplicar productos o editar precios manualmente cada vez.

Además, la arquitectura actual mezcla dos conceptos que deben separarse: las pestañas (tabs) hoy funcionan a la vez como categoría visual y como gate de disponibilidad. Eso impide tener un catálogo maestro estable y variantes operativas encima.

Hay también necesidades latentes que la base actual no soporta: programar un cambio de contexto en una fecha, cambiar el contexto activo de forma remota desde el celular del dueño mientras el cajero opera, delegar ese control a un co-admin, y auditar qué contexto está corriendo en cada dispositivo. Todo esto requiere un modelo de datos que exista en Fase 0 aunque las capacidades online esperen a Qentas.

---

## Solution

Introducimos el concepto de Modo. Un Modo es un perfil operativo con nombre (ejemplos: "Local principal", "Festival del mango", "Feria gastronómica") que define, sobre el catálogo maestro de productos, qué productos están activos, a qué precio y en qué orden de pestañas. El dispositivo tiene un currentModeId persistido. El cajero siempre ve únicamente los productos activos del Modo activo, con los precios override correspondientes si existen.

Las pestañas siguen existiendo como categorías visuales dentro de un Modo, pero dejan de controlar disponibilidad: eso lo decide el Modo a través de productOverrides. El catálogo maestro de productos sigue siendo la fuente de verdad sobre qué productos existen; los Modos solo decoran ese catálogo.

El owner es quien gestiona Modos: crear, clonar uno existente, editar sus overrides, activarlo en el dispositivo. Puede hacerlo desde dispositivo personal o fijo. El owner puede además programar el cambio de Modo en una fecha o rango futuro (scheduled mode changes): el Modo programado se activa automáticamente al llegar la fecha y al expirar vuelve al anterior. En Phase 0 esto se resuelve con cron local (verificación al cargar la app y timer interno); cuando Qentas esté, migra a disparadores server-side.

Con Qentas activada se desbloquean las capacidades distribuidas: el owner cambia el Modo activo desde su celular y el tablet del cajero se actualiza en segundos (remote real-time control), el dueño delega a un co-admin (Encargado) para que haga ese cambio, y existe un panel que muestra qué Modo tiene activo cada dispositivo/cajero para auditoría y control anti-fraude. Sin Qentas la app funciona como demo: los Modos locales operan normalmente en el dispositivo, pero no hay sync, ni control remoto, ni scheduled changes visibles fuera del aparato. Todo el feature gating se hace con el componente RequiresQentas y UpsellCard ya existentes de la Foundation F2.

El modelo parent/child queda consistente con Qentas: la cuenta Qentas es el parent, los workers son children scoped a la cuenta y no al dispositivo. Esto permite mix de deviceType fixed y personal sin fricción: un motorista opera en su celular personal, el cajero en la tablet fija del local, y ambos pertenecen a la misma cuenta.

---

## Modelo de datos

Se crea la entidad Mode con envelope de sync (accountId, deviceId, syncState, serverUpdatedAt, id UUID v4 via newId). Shape:

- id: string UUID v4
- name: string (ejemplo "Principal", "Festival del mango")
- description: string opcional
- productOverrides: objeto { [productId]: { active: boolean, priceOverride: number | null } }
- tabOrder: array de tabIds en el orden que el cajero debe verlos dentro del Modo
- isDefault: boolean (true solo para el Modo "Principal" creado por la migración)
- scheduledActivations: array de { id, startsAt, endsAt | null, previousModeId } — entradas de programación locales en Phase 0
- createdAt, updatedAt: ISO strings
- envelope estándar: accountId, deviceId, syncState, serverUpdatedAt

Persistencia: los Modos viven en AsyncStorage detrás de la repository layer existente (src/data/repository.js) con una key ventasv_modes. El currentModeId del dispositivo vive en su propia key ventasv_current_mode_id.

Migración schema v4 → v5 (idempotente): al arrancar por primera vez en v5, si no existe ningún Modo se crea uno llamado "Principal" con isDefault: true, todos los productos del catálogo actual marcados active: true sin priceOverride, y tabOrder igual al orden de tabs actual. currentModeId se setea a ese Modo "Principal". Si la migración ya corrió, es no-op. La migración debe ser segura si el catálogo está vacío o si no hay tabs. ventasv_schema_version pasa a 5.

---

## Roadmap de ejecución

El feature se entrega en tres PRs incrementales. Cada uno mergea a develop y debe terminar con 0 fallos en npm test.

PR 1 — feature/modos-foundation (fontanería invisible): arranca borrando los logs temporales [F1 VERIFY] y [F2 VERIFY] del loadData de src/context/AppContext.js marcados TODO(cleanup-next-pr), como acordamos en la regla de verification logs. Después crea el modelo Mode en src/models/mode.js, extiende src/data/repository.js con CRUD de Modes y get/set de currentModeId, implementa la migración v4 → v5 en src/data/schemaMigrationV5.js siguiendo el patrón de schemaMigrationV4, actualiza ventasv_schema_version a 5 en el flujo de migraciones, y expone currentModeId / modes / setCurrentMode / createMode / updateMode / deleteMode / cloneMode desde AppContext. No hay cambios visibles en la UI del cajero en este PR: el cajero sigue viendo exactamente lo mismo porque el Modo "Principal" replica el estado actual. Este PR SÍ incluye logs temporales [MODOS-F1 VERIFY] tagueados TODO(cleanup-next-pr) que confirmen al bootear: schema version = 5, cantidad de Modos en storage, currentModeId, cantidad de productos activos en el Modo activo. Tests unitarios en __tests__/unit/modes/ cubren: modeModel shape y defaults, repositoryModes CRUD, schemaMigrationV5 idempotencia, migración con catálogo vacío, migración con catálogo existente copiado a Modo Principal, AppContext expone API de Modos correctamente.

PR 2 — feature/modos-cajero-ui (UX visible del cajero): arranca borrando los logs [MODOS-F1 VERIFY] del PR anterior. Hace que POSScreen filtre productos por el Modo activo usando productOverrides.active, que OrderBuilder lea priceOverride cuando exista (cayendo al precio base del producto si no hay override), y que las tabs se rendericen siguiendo tabOrder del Modo activo. Agrega un indicador compacto del Modo activo visible al cajero en POSScreen (pill adaptativo al contenido, adaptado a theme). Las tabs dejan de decidir disponibilidad de productos: solo son categorías visuales; la disponibilidad viene únicamente del Modo. Este PR NO incluye logs (es cambio visible). Tests: itemsLogic y cartLogic adaptados a priceOverride, homeScreen filtrado por Modo activo, tabOrder aplicado correctamente, fallback a precio base cuando no hay override.

PR 3 — feature/modos-gestion-owner (gestión y scheduling): pantalla de Gestión de Modos en ProfileStack accesible solo para owner y co-admin con permiso delegado: listar Modos, crear, clonar, editar nombre y overrides por producto, editar tabOrder, activar, eliminar (con confirmación custom, nunca Alert nativa). Scheduled mode changes locales: UI para programar startsAt / endsAt / modo destino, verificación al cargar la app y timer interno que evalúa cada minuto las activaciones pendientes. UpsellCard envolviendo las capacidades Qentas-only: control remoto desde el celular del dueño, panel de Modo activo por dispositivo, delegación fina a co-admin, scheduling server-side. Todo el feature gating con <RequiresQentas fallback={<UpsellCard />}>. Este PR NO incluye logs. Tests: modeManagementLogic (crear, clonar, editar, eliminar), scheduledModeLogic (evaluación de activaciones pendientes, transición automática, reversión al expirar), permissions (owner siempre puede, co-admin solo con flag delegado, cajero nunca).

---

## Reglas globales

El catálogo maestro de productos sigue siendo la fuente de verdad sobre qué productos existen; los Modos nunca crean ni eliminan productos, solo los activan, desactivan o cambian su precio visible. Borrar un producto del catálogo remueve automáticamente su entrada de productOverrides en todos los Modos (cleanup en la capa de repository).

Un Modo no puede eliminarse si es el currentModeId de algún dispositivo en la cuenta; el owner debe activar otro Modo antes. El Modo "Principal" marcado isDefault es indelegable y no puede eliminarse, pero sí editarse.

Cambiar currentModeId nunca modifica ventas ya cerradas ni órdenes abiertas: las órdenes en curso conservan los precios con los que se construyeron. Una orden en construcción que se abandona al cambiar de Modo queda con sus items tal cual estaban; no hay recálculo retroactivo.

priceOverride es absoluto, no porcentaje. Un override de null o ausente significa "usar precio base del producto".

Las pestañas (tabs) siguen siendo una entidad independiente con su propio CRUD actual, pero su array de productos deja de ser consultado para decidir disponibilidad en POSScreen; solo se usa para agrupación visual cuando el Modo activo las lista en su tabOrder.

Todo cambio que toque lógica de rol (owner, co-admin, worker) incluye el grep global grep -r "role ===" src/ en la descripción del PR, según la regla de CLAUDE.md.

Los logs de verificación siguen la convención establecida: PR 1 incluye [MODOS-F1 VERIFY] tagueados TODO(cleanup-next-pr) y arranca borrando los [F1 VERIFY] y [F2 VERIFY] pendientes; PR 2 arranca borrando los [MODOS-F1 VERIFY]; PR 3 no incluye logs. Ningún PR deja logs sin borrar en el siguiente.

---

## Verification

PR 1 queda verificado si: ventasv_schema_version es 5 al bootear, existe un único Modo "Principal" con isDefault: true que contiene todos los productos actuales activos sin priceOverride, currentModeId apunta a ese Modo, los logs [MODOS-F1 VERIFY] muestran los conteos esperados, no quedan logs [F1 VERIFY] ni [F2 VERIFY], y los 602+ tests siguen pasando con las suites nuevas de Modos sumadas.

PR 2 queda verificado si: el cajero ve solo los productos activos del Modo activo, los precios con override se aplican al agregar al carrito, el orden de tabs respeta tabOrder, el indicador de Modo activo aparece en POSScreen, y los tests cubren filtrado y priceOverride.

PR 3 queda verificado si: owner crea, clona, edita, activa y elimina Modos desde ProfileStack, las capacidades Qentas-only muestran UpsellCard mientras qentasClient.isConnected sea false, una activación programada en el futuro cercano dispara la transición automática al llegar su startsAt y revierte al expirar endsAt, y los tests cubren la lógica de scheduling sin renderizar componentes.

Sobre todo el feature, queda verificado si: sin Qentas la app opera como demo local completa (Modos locales funcionan, sin sync ni control remoto ni scheduling server-side), con Qentas simulada como conectada los gates abren los features distribuidos, y la decisión de filtro sigue respondiendo afirmativamente a si ayuda a un dueño en El Salvador a correr mejor su negocio hoy.
