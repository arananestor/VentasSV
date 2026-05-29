# Feature Retro: Owner Mode Toggle

- **Date:** 2026-05-23
- **PR:** feature/owner-mode-toggle
- **Design doc:** docs/architecture_design/owner_mode_toggle.md

## Resumen

Campo ownerMode ('operativo' o 'administrativo') agregado al worker owner, persistido en AsyncStorage como parte del objeto worker. Toggle en ProfileScreen con confirmación obligatoria vía CenterModal. roleConfig.getTabsForWorker consulta ownerMode para filtrar tabs: administrativo muestra solo Perfil, operativo muestra los 4 tabs. Default operativo. Sin migración — workers pre-PR se tratan como operativo.

El mismo PR incluye housekeeping de CLAUDE.md: Skills mapping table (que quedó como commit huérfano en PR #77 y se eliminó al mergear), Owner work mode pattern, dos reglas nuevas de proceso (Skills orchestration, ADR Alternatives Considered), Co-admin permissions matrix como priority #4.

## Cambios

- **src/context/AuthContext.js** — ownerMode: 'operativo' en setupOwner. setOwnerMode(mode) valida role owner, actualiza workers en memoria y AsyncStorage, actualiza currentWorker. Expuesto en provider value.
- **src/utils/roleConfig.js** — ADMIN_ONLY_TABS exportada (['Perfil']). getTabsForWorker: owner + administrativo → ADMIN_ONLY_TABS, owner + operativo/ausente → ALL_TABS.
- **src/screens/ProfileScreen.js** — Sección "MODO DE TRABAJO" con card, descripción en voseo, botón outline. CenterModal de confirmación con microcopy validado.
- **__tests__/unit/roleConfig.test.js** — 5 tests nuevos: owner operativo, owner sin ownerMode (default), owner administrativo, ADMIN_ONLY_TABS contiene Perfil, ADMIN_ONLY_TABS subset de ALL_TABS.
- **CLAUDE.md** — Skills mapping como tabla markdown (7 filas), Owner work mode pattern, Skills orchestration rule, ADR Alternatives rule, Active priorities con Co-admin #4, 801 tests.
- **docs/feature_retros/2026-05-23_owner-mode-toggle.md** — este archivo.

## Qué funcionó

- La propagación reactiva ya estaba resuelta: App.js consume getTabsForWorker(currentWorker) dentro de MainTabs, y setOwnerMode actualiza currentWorker vía setCurrentWorker. React re-renderiza los tabs automáticamente al cambiar el modo — no fue necesario tocar App.js.
- El patrón de setOwnerMode siguió exactamente el de updateWorkerPhoto: actualizar array → persistir → actualizar currentWorker. Cero inventiva, cero bugs.
- getTabsForWorker es una función pura con CJS exports — los tests existentes cubrían todos los roles y el nuevo test de ownerMode encajó sin mocking.

## Lecciones

- El design doc anticipó que AppNavigator.js podría necesitar cambios para propagación reactiva. En realidad la lógica está en App.js y ya era reactiva. Leer el código antes de asumir es siempre más barato que codificar un fix innecesario.
- El commit del Skills mapping table se perdió entre PR #77 (donde se hizo como segundo commit) y develop (donde se eliminó al mergear). El housekeeping se resolvió aplicándolo nuevamente en este PR — costo cero, pero la lección es que commits sobre archivos compartidos (CLAUDE.md) en branches de design docs son frágiles si el branch se re-crea.
- Workers pre-PR sin ownerMode se tratan como operativo sin escribir nada al storage. Esta decisión de no-migración es deliberada: la primera vez que el owner cambia su modo, setOwnerMode escribe el campo. Hasta entonces, el field simplemente no existe y el código lo lee como undefined → default operativo.

## Segundo commit — rediseño del modal de cambio de modo

Al probar en device, el modal de confirmación tenía tres problemas visuales: el título "¿CAMBIAR A MODO ADMINISTRATIVO?" con letterSpacing 3 se desbordaba del ancho del modal en pantallas chicas, el texto del botón "CAMBIAR A ADMINISTRATIVO" igualmente se cortaba o wrapeaba, y la estructura visual general (título arriba vía prop title + texto + botón largo) no seguía el patrón establecido por el modal "ELIMINAR EMPLEADO" del mismo archivo.

La solución fue seguir exactamente la estructura del modal ELIMINAR EMPLEADO: ícono en círculo arriba (refresh-cw en lugar de trash-2), título corto centrado ("MODO ADMINISTRATIVO" / "MODO OPERATIVO" — el destino, no la pregunta), sub-mensaje explicativo, y botón primario con texto corto "CAMBIAR". Se eliminó el prop title del CenterModal y todo el contenido se movió dentro de children con el wrapper alignItems center.

La decisión de acortar el botón de "CAMBIAR A ADMINISTRATIVO" a solo "CAMBIAR" es correcta en este contexto: dentro de un modal que ya tiene ícono + título + sub-mensaje describiendo completamente la acción, el botón solo necesita confirmar. El contexto visual carga la semántica. Fuera de un modal (botón standalone), el texto sí necesita auto-describirse porque no hay contexto alrededor.

El cambio fue puramente visual — cero lógica tocada, tests pasaron sin ajustes (801 tests, 0 failures). La ejecución fue directa: copiar la estructura del modal ELIMINAR EMPLEADO, cambiar ícono/título/sub/botón, eliminar prop title. Sin iteración necesaria.
