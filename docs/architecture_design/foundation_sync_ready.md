# Architecture Design: Foundation — Sync-Ready Layer

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-14
- Target branch: docs/foundation-sync-ready-design
- Execution branches (2): feat/foundation-ids-repository, feat/foundation-qentas-stub

---

## Problem

La app hoy es offline-first, un solo dispositivo, sin concepto de cuenta global. Esto funciona bien para el MVP, pero choca de frente con lo que viene:

- Qentas será el backend que une dueño + empleados + dispositivos + ventas bajo una misma cuenta.
- El dueño debe poder ver, controlar y modificar su negocio desde múltiples dispositivos en tiempo real.
- Empleados pueden usar sus propios celulares (personal) o dispositivos del negocio (fixed); motoristas y repartidores típicamente usan el suyo.
- Modos (ubicaciones / menús programados) — feature siguiente — requiere que los productos y overrides vivan a nivel cuenta, no dispositivo.
- Prestaciones y pagos de empleados via Qentas requieren identidad global del worker, no local.

Bloqueantes concretos en el código actual:

1. IDs se generan con Date.now() + Math.random(). Dos dispositivos offline pueden generar el mismo ID para entidades distintas. Al sincronizar colisionan.
2. Ninguna entidad (Sale, Product, Worker, Tab, Announcement futuro, Shift futuro) tiene accountId ni deviceId. No hay forma de atribuir un registro a una cuenta Qentas ni a un dispositivo específico.
3. Todos los writes van directo a AsyncStorage desde los contexts. No hay punto único donde se pueda interceptar un write para encolarlo a sincronización futura.
4. BusinessConfig no distingue entre "modo standalone" (sin Qentas) y "modo conectado". Las features que requieren backend (control remoto, scheduled changes, audit log) tendrán que convivir con las offline sin gate.
5. No hay identidad persistente de dispositivo. El owner no puede ver "qué dispositivo hizo qué" ni revocar acceso a un dispositivo comprometido.
6. El cliente Qentas es un hook placeholder, no un contrato. Cuando Qentas tenga API real no hay dónde enchufarlo sin tocar cada context.

Este PR resuelve estos 6 bloqueos en una capa invisible al usuario. Nada cambia visualmente. Internamente la app queda lista para enchufarse al cloud sin rediseños.

---

## Solution

Introducimos 5 primitivas:

1. **IDs globales (UUID v4)** — reemplazan Date.now()+Math.random() en todas las entidades nuevas. Las entidades viejas mantienen su ID (no vale la pena migrarlos; son únicos en ese dispositivo y seguirán siendo únicos al subirlos a Qentas con su accountId).
2. **Device identity** — cada dispositivo genera y persiste un deviceId UUID al primer arranque. Persiste en AsyncStorage con clave ventasv_device_id.
3. **Entity envelope extendido** — toda entidad sincronizable agrega accountId (null si standalone), deviceId (del dispositivo que la creó), syncState ('local' | 'pending' | 'synced' | 'conflict'), serverUpdatedAt (null o ISO string).
4. **Repository layer** — módulo único src/data/repository.js que envuelve AsyncStorage. Todos los writes de contexts pasan por aquí. Hoy es pass-through; mañana es el punto donde se encola el push a Qentas.
5. **Qentas client stub + feature gating** — src/services/qentasClient.js expone un contrato estable (isConnected, getAccount, pushEvent, subscribe). Hoy siempre devuelve isConnected: false. Componente <RequiresQentas fallback={...}> envuelve features que necesitan cloud.

Esto se parte en 2 PRs de ejecución.

### Roadmap de ejecución

| PR | Nombre | Scope |
|----|--------|-------|
| F1 | feat/foundation-ids-repository | UUID v4, deviceId persistente, entity envelope, repository layer, migración schema v3→v4 |
| F2 | feat/foundation-qentas-stub    | qentasClient.js stub con contrato, <RequiresQentas>, BusinessConfig flags qentasConnected / qentasAccountId |

Cada PR se abre después de mergear el anterior. Cada uno trae su propio retro.

---

## Modelo de datos

### Nuevo: Device identity (AsyncStorage key ventasv_device_id)

Valor: string UUID v4 generado la primera vez que la app arranca.

Nunca se regenera. Si el usuario borra data de la app, se genera uno nuevo (el dispositivo "olvida" su identidad pasada, comportamiento correcto).

### Extensión a entidades existentes

Todas las entidades sincronizables agregan estos campos (opcionales para compat con data vieja):

- accountId: string | null (null mientras no haya Qentas connected; se setea al conectar cuenta)
- deviceId: string (se setea al crear la entidad, leído de ventasv_device_id)
- syncState: 'local' | 'pending' | 'synced' | 'conflict' (default 'local')
- serverUpdatedAt: ISO string | null (se setea cuando el server confirma)

Entidades que reciben el envelope:
- Sale (ya en v3, pasa a v4 con estos campos)
- Product
- Worker
- Tab
- BusinessConfig (aunque es singleton, también se sincroniza — tiene accountId + syncState)

Entidades que NO reciben envelope (puro estado local, no se sincroniza):
- Cart (sesión)
- Active tab ID (preferencia de dispositivo)
- Theme (preferencia de dispositivo)
- Current shift futuro (estado operativo del dispositivo, se cerrará y sincronizará el shift completo cuando termine)

### Migración de schema (v3 → v4)

Al cargar en cada context:

1. Lee ventasv_schema_version (nueva clave, unificada — antes teníamos ventasv_sales_schema_version, lo consolidamos).
2. Si es < 4 o ausente:
   - Asegura que ventasv_device_id exista; si no, genera UUID v4 y persiste.
   - Para cada entidad en AsyncStorage (sales, products, workers, tabs, business_config): si no tiene accountId/deviceId/syncState/serverUpdatedAt, los agrega con valores default (accountId: null, deviceId: el del dispositivo, syncState: 'local', serverUpdatedAt: null).
   - Persiste todas las colecciones actualizadas.
   - Escribe ventasv_schema_version = '4'.
   - El ventasv_sales_schema_version viejo se conserva pero no se usa — opcional eliminarlo en migración de limpieza futura.

La migración es idempotente: correr loadData dos veces no duplica ni rompe nada.

---

## Fase F1 — UUIDs + deviceId + repository + schema v4

### Cambios

1. **Nueva utilidad src/utils/ids.js (pura)**
   - newId() — devuelve UUID v4 string. Implementación: usa la librería uuid (ya instalada en muchos proyectos Expo; si no, instalar "uuid" y "react-native-get-random-values" y cargar el polyfill en App.js top-level).
   - isValidUuid(id) — devuelve true si el string matcha el regex de UUID v4.

2. **Nuevo servicio src/services/deviceId.js**
   - getDeviceId() async — lee ventasv_device_id de AsyncStorage. Si no existe, genera newId(), persiste y retorna. Cache en memoria para llamadas repetidas.
   - resetDeviceId() async — genera uno nuevo y persiste. Solo para tests.

3. **Nueva utilidad src/utils/entityEnvelope.js (pura)**
   - attachEnvelope(entity, { deviceId, accountId }) — devuelve entity con accountId (default null), deviceId, syncState: 'local', serverUpdatedAt: null. Si ya los tiene, preserva los existentes (idempotente).
   - markPending(entity) — devuelve entity con syncState: 'pending'.
   - markSynced(entity, serverUpdatedAt) — devuelve entity con syncState: 'synced' y serverUpdatedAt.

4. **Nuevo módulo src/data/repository.js**
   - Expone métodos para cada colección: sales, products, workers, tabs, businessConfig.
   - API por colección: getAll(), save(collection), upsert(entity), remove(entityId).
   - Internamente usa AsyncStorage con la key correspondiente (ventasv_sales, ventasv_products, etc).
   - Cada upsert/save asegura que las entidades tengan envelope (llama attachEnvelope con deviceId del dispositivo).
   - Hoy es pass-through a AsyncStorage. Mañana (Qentas) agrega encolado de eventos.
   - Exporta una función init() que carga el deviceId y lo cachea antes de que cualquier context haga writes.

5. **Migración schema v4**
   - Nueva utilidad src/utils/schemaMigrationV4.js:
     - migrateCollectionToV4(collection, deviceId) — aplica attachEnvelope a cada item si le falta. Idempotente.
   - En AppContext.loadData, AuthContext (donde carga workers), TabContext.loadTabs, BusinessConfigScreen / BusinessConfig loader: después de cargar la colección, revisar ventasv_schema_version. Si < 4, correr migrateCollectionToV4 con el deviceId actual, persistir, marcar version = '4'.
   - Unificar la clave de schema version en ventasv_schema_version. La clave vieja ventasv_sales_schema_version se ignora de aquí en adelante (dejar una nota en código).

6. **Contexts: migrar writes a repository**
   - AppContext.addSale, addProduct, updateProduct, deleteProduct, updateSaleStatus, updateSaleItemUnit: reemplazar llamada directa a AsyncStorage.setItem por repository.upsert / repository.remove.
   - AuthContext: mismo patrón para workers.
   - TabContext: mismo patrón para tabs.
   - BusinessConfig: mismo patrón.
   - Todas las funciones add* generan nuevo id con newId() (UUID v4) en vez de Date.now()+Math.random(). IDs viejos se respetan en la migración.

7. **App.js**
   - En el top-level, antes de cualquier provider: import 'react-native-get-random-values' (requerido por uuid en RN).
   - Al inicializar AppProvider, correr repository.init() que garantiza deviceId cargado antes de cualquier write.

### Tests (__tests__/unit/) con AAA estricto

- ids.test.js (~6): newId devuelve UUID v4 válido; dos llamadas devuelven IDs distintos; isValidUuid acepta UUIDs v4; rechaza strings viejos tipo Date.now; rechaza null/undefined.
- deviceId.test.js (~6): primera llamada genera y persiste; segunda llamada devuelve el mismo; resetDeviceId cambia el valor; persistencia correcta con AsyncStorage mockeado.
- entityEnvelope.test.js (~10): attachEnvelope agrega campos default; preserva valores existentes; idempotente; markPending / markSynced modifican solo syncState y serverUpdatedAt.
- schemaMigrationV4.test.js (~10): migrateCollectionToV4 agrega envelope a entidades sin él; preserva envelope existente; idempotente; array vacío queda vacío; items con envelope parcial completan los faltantes.
- repository.test.js (~10): upsert agrega envelope si falta; remove elimina por id; save reemplaza colección completa; getAll devuelve colección persistida; init carga deviceId.

### Reglas Fase F1

- Ningún cambio visible en la UI. Toda la migración corre silenciosa al arrancar.
- Los IDs viejos (Date.now+Math.random) se respetan; no se migran. La migración solo agrega envelope, no reescribe ids.
- Todas las funciones add* ahora generan newId() UUID v4.
- Tests llaman funciones reales de src/ (AAA). No mockean la librería uuid; usan la real.
- Después del PR, grep -rn "Date.now().toString() + Math.random()\|Date.now() + '_' + Math.random()" src/ debe devolver solo matches en sitios no-entidad (ej: cartId de items del carrito, snackData sin persistencia). Pegar el output en la descripción.

---

## Fase F2 — Qentas client stub + feature gating + config flags

### Cambios

1. **Nuevo servicio src/services/qentasClient.js**
   - Export default: singleton con contrato estable:
     - isConnected() → boolean (hoy siempre false)
     - getAccount() → { id, ownerEmail, plan } | null (hoy null)
     - pushEvent(event) → Promise<void> (hoy no-op)
     - subscribe(entityType, callback) → unsubscribe function (hoy no-op)
     - connect({ email, password } | { token }) → Promise<{ account } | { error }> (hoy retorna { error: 'qentas_not_available' })
     - disconnect() → Promise<void> (hoy no-op)
   - Archivo bien documentado con comentarios que expliquen el contrato — será el contrato que Qentas implemente del otro lado.

2. **Nuevo componente src/components/RequiresQentas.js**
   - Props: children, fallback (opcional).
   - Consume qentasClient.isConnected() vía hook useQentasConnection (nuevo).
   - Si connected: renderiza children.
   - Si no connected: renderiza fallback si lo hay; si no, null.

3. **Nuevo hook src/hooks/useQentasConnection.js**
   - Expone { isConnected, account, connect, disconnect }.
   - Hoy devuelve { isConnected: false, account: null, connect: async () => ({ error }), disconnect: async () => {} }.
   - Cuando Qentas tenga API real, solo se actualiza el qentasClient, el hook no cambia.

4. **Extensiones a BusinessConfig**
   - Nuevos campos: qentasConnected (boolean, default false), qentasAccountId (string | null, default null).
   - Migración dentro de schema v4: si BusinessConfig no tiene estos campos, agregarlos con defaults.
   - Edit manual desde BusinessConfigScreen: NO se expone aún (el usuario no debe tocar esto manualmente; lo setea el flujo de connect cuando exista).

5. **Placeholder UI: UpsellCard**
   - Nuevo componente src/components/UpsellCard.js.
   - Props: title, description, ctaLabel (opcional, default "Conectar Qentas"), onCta.
   - Diseño limpio, consistente con los cards actuales. Un ícono (MaterialCommunityIcons cloud-lock-outline), título, descripción, botón CTA.
   - Se usa como fallback en <RequiresQentas> para features futuras.
   - NO se agrega a ninguna pantalla todavía — solo queda disponible para usar en futuros features (Modos remotos, dashboards, etc).

### Tests (__tests__/unit/)

- qentasClient.test.js (~8): isConnected false; getAccount null; pushEvent no-op resuelve; connect con credenciales devuelve error; disconnect resuelve; subscribe devuelve unsubscribe function; unsubscribe se puede llamar sin efecto.
- requiresQentasLogic.test.js (~6): lógica pura en src/utils/requiresQentasLogic.js que decide qué renderizar según isConnected y fallback presence. Tests cubren connected+children; disconnected+fallback; disconnected+sin_fallback (devuelve null).
- upsellCardLogic.test.js (~4): validación de props (title obligatorio, ctaLabel default, onCta opcional).
- businessConfigQentasFields.test.js (~6): BusinessConfig con campos viejos migra agregando qentasConnected: false y qentasAccountId: null; idempotente; no sobreescribe valores existentes.

### Reglas Fase F2

- qentasClient es puro contrato. Cero lógica real. El día que Qentas tenga backend, se reemplaza la implementación del archivo y todo lo demás sigue igual.
- <RequiresQentas> se construye pero NO se usa en ninguna pantalla todavía. Queda como primitiva lista.
- UpsellCard lo mismo — se crea, se testea, no se renderiza en ningún flujo.
- BusinessConfigScreen NO expone los nuevos campos al usuario.
- Tests llaman funciones reales.

---

## Reglas globales

- UI en español, código/commits/comentarios en inglés.
- Tests con patrón AAA (// Arrange, // Act, // Assert), Act llama funciones reales de src/.
- Cada Fase (F1, F2) es un PR independiente con su propio retro en docs/feature_retros/.
- Ninguna Fase toca archivos fuera de su scope listado.
- CLAUDE.md se actualiza en cada Fase con conteo de tests, lista de suites nuevas y priorities.
- Ningún cambio rompe el flujo del usuario — la app se ve y funciona exactamente igual que hoy.
- Sin @testing-library/react-native.
- Sin Co-Authored-By ni Generated with Claude Code.
- Instalación de dependencias nuevas (uuid, react-native-get-random-values): verificar compatibilidad con Expo SDK 54 y React 19.1.0 antes del PR. Si hay incompatibilidad, usar implementación manual de UUID v4 basada en crypto.getRandomValues (estándar, trivial, ~15 líneas).

---

## Verification

### Fase F1
1. npm test — 0 fallos, ~40-50 tests nuevos.
2. Manual: abrir app con data existente (v3) → la migración corre silenciosa → revisar AsyncStorage: ventasv_schema_version === '4', ventasv_device_id es UUID v4, cada sale/product/worker/tab tiene accountId: null, deviceId: <UUID>, syncState: 'local', serverUpdatedAt: null.
3. Manual: crear producto nuevo → ID es UUID v4, no Date.now.
4. Manual: crear venta nueva → mismo chequeo.
5. Manual: reiniciar app → deviceId se conserva, no se regenera.

### Fase F2
1. npm test — 0 fallos, ~20-25 tests nuevos.
2. Manual: la app se ve y funciona igual que antes — NO hay cambios visibles.
3. Manual: BusinessConfig loaded → tiene qentasConnected: false y qentasAccountId: null.
4. Manual (developer): en dev-tools, llamar qentasClient.isConnected() → false. Llamar connect({}) → { error: 'qentas_not_available' }.
