# Architecture Design: Sale Model Refactor — One Sale, Many Items

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-13
- Target branch: docs/sale-items-refactor-design
- Execution branches (3): feat/sale-items-model, feat/sale-items-consumers, feat/sale-items-ticket-wa

---

## Problem

Hoy, cuando el cajero cobra un pedido con varios productos, PaymentScreen.handleComplete itera el carrito y llama addSale una vez por cada ítem. Cada llamada genera un orderNumber nuevo, así que un solo cobro produce N ventas con N números de pedido distintos.

Consecuencias:
- SaleDetailScreen muestra cada producto como una venta aparte.
- SalesScreen lista el mismo cobro como varias filas.
- OrdersScreen/Comandas rompe el concepto de pedido: el cocinero ve productos sueltos, no la orden completa.
- Ticket impreso y mensaje WhatsApp se generan por producto, no por cobro.
- CSV y reportes futuros cuentan N transacciones en lugar de 1. Total por cobro imposible sin agrupar por timestamp.
- Corte de caja (futuro cuarto del cajero) no puede contar pedidos vs ítems correctamente.
- Anulaciones y devoluciones no tienen unidad coherente.

Ninguna plataforma POS trabaja así. Un cobro = una venta = un número de pedido. Este refactor es prerequisito del cuarto del cajero.

---

## Solution

Refactorizar el modelo de Sale a un cobro = una venta con items[]. El checkout produce una sola llamada a addSale, un solo orderNumber, un solo registro persistido. Todos los consumidores (detail, sales list, orders, ticket, whatsapp, csv) se actualizan para leer items[]. La migración v2→v3 envuelve las ventas viejas automáticamente.

La ejecución se parte en 3 PRs secuenciales:

| PR | Nombre | Scope |
|----|--------|-------|
| A  | feat/sale-items-model      | Utilidades nuevas, migración v2→v3, PaymentScreen hace un solo addSale, shim temporal en consumers |
| B  | feat/sale-items-consumers  | SaleDetailScreen, SalesScreen, OrdersScreen + CookModal leen items[], se retira el shim |
| C  | feat/sale-items-ticket-wa  | ticketPrinter, buildTicketMessage, buildTransferMessage, snackbar WhatsApp |

---

## Modelo de datos

Nuevo schema de Sale (v3):

{
  id: string,
  orderNumber: string,
  timestamp: ISO string,
  items: [
    {
      productId: string,
      productName: string,
      size: string,
      quantity: number,
      units: [{ cookLevel: string }],
      extras: string[],
      note: string,
      subtotal: number
    }
  ],
  total: number,
  paymentMethod: 'cash' | 'transfer',
  cashGiven: number | null,
  change: number | null,
  voucherImage: string | null,
  workerId: string,
  workerName: string,
  geo: { latitude, longitude } | null,
  orderStatus: 'new' | 'processing' | 'done',
  kitchenNumber: string | null
}

Invariantes:
- Cada checkout produce exactamente 1 addSale y 1 orderNumber.
- sale.items nunca vacío, mínimo 1 elemento.
- sale.total === suma de items.subtotal (validado en tests).
- ventasv_sales_schema_version sube de 2 a 3.

Migración v2→v3 (al cargar en AppContext):

Cada sale vieja se envuelve en:
{
  ...oldSale,
  items: [{
    productId: oldSale.productId,
    productName: oldSale.productName,
    size: oldSale.size || '',
    quantity: oldSale.quantity,
    units: oldSale.units || [],
    extras: oldSale.extras || oldSale.toppings || [],
    note: oldSale.note || '',
    subtotal: oldSale.total
  }],
  total: oldSale.total
}

Los campos singulares del root se eliminan. La migración es idempotente.

---

## Fase A — Modelo + migración + PaymentScreen

Cambios:

1. Nueva utilidad src/utils/itemsLogic.js (pura):
   - buildSaleItem(cartItem): devuelve item del sale sin cartId, con subtotal calculado.
   - buildMultiItemSaleData({ cart, paymentMethod, cashGiven, change, voucherImage, worker, geo }): devuelve { items, total, paymentMethod, cashGiven, change, voucherImage, workerId, workerName, geo }. Sin id, orderNumber ni timestamp.
   - getSaleItemCount(sale): suma de items[i].quantity.
   - getSaleSummary(sale): "Pollo asado" si hay uno, "Pollo asado + 2 más" si hay varios.
   - validateSale(sale): throw si items vacío o si total no cuadra con suma de subtotales.

2. Nueva utilidad src/utils/salesMigration.js (pura):
   - migrateSaleV2toV3(oldSale): envuelve en items[], idempotente.
   - migrateAllSalesV2toV3(sales): aplica a cada sale del array.

3. src/context/AppContext.js:
   - loadData: después de setSales, leer ventasv_sales_schema_version. Si es < 3 o ausente, correr migrateAllSalesV2toV3, persistir ventasv_sales y guardar ventasv_sales_schema_version = '3'.
   - addSale: valida que sale.items exista y no esté vacío (throw si no). Sin cambios de firma.

4. src/screens/PaymentScreen.js:
   - Importar buildMultiItemSaleData.
   - Reemplazar el for loop de handleComplete (líneas 67-92) por una sola llamada:
     const saleData = buildMultiItemSaleData({ cart, paymentMethod, cashGiven, change, voucherImage, worker: currentWorker, geo });
     const sale = await addSale(saleData);
     if (kitchenNumber) await updateSaleStatus(sale.id, 'processing');
     clearCart();
     showSnack({ sales: [sale], total: sale.total, waNumber: business?.whatsapp });
   - Modo no-carrito (venta rápida single-product): construir array de 1 elemento y usar el mismo path.

5. Snackbar en AppContext:
   - handleSnackWhatsApp: eliminar el forEach que abre múltiples URLs. Ahora 1 solo Linking.openURL con el mensaje consolidado.

6. Shim temporal de Fase A en consumers (SaleDetailScreen, SalesScreen, OrdersScreen, ticketPrinter, buildTicketMessage, buildTransferMessage):
   - Leer sale.items?.[0]?.productName ?? sale.productName y equivalentes para size, quantity, units, extras, note.
   - Esto mantiene la app funcionando con data v3 mientras Fase B/C los adapta correctamente.
   - Comentario obligatorio encima del shim: // TODO(fase-b): remove shim, consume sale.items directly.

Tests (__tests__/unit/):

- itemsLogic.test.js — AAA, ~12 tests: buildSaleItem con/sin size/extras/units, buildMultiItemSaleData con 1 y 3 ítems, total correcto, geo null, validateSale throw con items vacío, throw con total desigual, getSaleItemCount, getSaleSummary con 1 y varios productos.
- salesMigration.test.js — AAA, ~8 tests: v2 con productName/size/quantity migra, v2 con units migra, v2 con toppings legacy mapea a extras, v3 idempotente, array mixto queda todo v3, total preservado, sale sin total migra con subtotal=0.
- __tests__/integration/payment.test.js (actualizar): multi-item checkout produce 1 sola sale con items.length === cart.length, 1 solo orderNumber, total correcto.

Reglas Fase A:
- Migración idempotente: correr loadData dos veces no duplica nada.
- addSale valida items (throw si no).
- Los shims se marcan con TODO(fase-b) para retirarlos en Fase B.
- Antes del PR, grep -rn "sale.productName\|sale.size\|sale.quantity\|sale.toppings" src/ — los únicos matches aceptables son los shims marcados con TODO(fase-b) y el archivo de migración. Pegar el output en la descripción del PR.

---

## Fase B — Consumers (SaleDetail, Sales, Orders)

Cambios:

1. src/screens/SaleDetailScreen.js:
   - Render sale.items.map(...). Cada item muestra productName, size, quantity, extras, note, subtotal.
   - Header: 1 orderNumber, 1 total, 1 hora, 1 workerName.
   - Retirar shim de Fase A.
   - Static map sin cambios.

2. src/screens/SalesScreen.js:
   - Cada fila muestra orderNumber, getSaleSummary(sale), total, hora.
   - Retirar shim.

3. src/screens/OrdersScreen.js + CookModal:
   - Card de comanda muestra orderNumber, workerName, items como sub-lista compacta (nombre + quantity).
   - CookModal recibe la sale completa. Permite marcar cookLevel de cada unidad en sale.items[i].units[j].cookLevel.
   - Nueva acción en AppContext: updateSaleItemUnit(saleId, itemIndex, unitIndex, cookLevel) — persiste y actualiza state.
   - Retirar shim.

Tests:
- saleDetailItems.test.js — lógica pura de render de items, ~8 tests.
- salesListSummary.test.js — getSaleSummary con casos edge, ~5 tests.
- cookModalItems.test.js — lógica pura de actualización de units, ~10 tests.
- Actualizar salesLogic.test.js para que los totales sigan cuadrando con items[].

Reglas Fase B:
- Retirar TODOS los shims marcados con TODO(fase-b).
- Después de Fase B, grep -rn "sale.productName\|sale.size\|sale.quantity\|sale.units\|sale.extras\|sale.note\|sale.toppings" src/ debe devolver matches solo en src/utils/salesMigration.js. Pegar el output en la descripción del PR.
- No tocar ticketPrinter ni businessConfig (eso es Fase C — sus shims se mantienen).

---

## Fase C — Ticket, WhatsApp, snackbar

Cambios:

1. src/utils/ticketPrinter.js:
   - generateTicketHTML(sale) loopea sale.items. Una sección por item: nombre, size, quantity, extras, note, subtotal.
   - Footer: total único, paymentMethod, cashGiven/change, voucherImage.
   - Retirar shim.

2. src/utils/businessConfig.js:
   - buildTicketMessage(sale): encabezado único (orderNumber, total, paymentMethod), luego loop de items como líneas "*Pollo asado* — Grande × 2 — $14.00", extras y notas indentados.
   - buildTransferMessage(sale): mismo patrón con info bancaria al final.
   - Retirar shim.

3. Snackbar en AppContext:
   - handleSnackWhatsApp usa el builder nuevo sobre la sale única.

Tests:
- ticketPrinter.test.js (nuevo) — render HTML con 1 y 3 items, con extras, con note, sin note; total y orderNumber aparecen una sola vez. ~10 tests.
- ticketMessage.test.js — buildTicketMessage con 1 y varios items, cash vs transfer. ~10 tests.
- transferMessage.test.js — buildTransferMessage con varios items + info bancaria. ~6 tests.

Reglas Fase C:
- Formato visible del ticket y WhatsApp se mantiene lo más parecido posible al actual, solo expandido a lista de items.
- Después de Fase C, grep -rn "sale.productName\|sale.size\|sale.quantity\|sale.units\|sale.extras\|sale.note\|sale.toppings" src/ debe devolver matches solo en src/utils/salesMigration.js. Pegar el output.

---

## Reglas globales del refactor

- UI en español, código/commits/comentarios en inglés.
- Tests con patrón AAA (// Arrange, // Act, // Assert), Act llama funciones reales de src/.
- Cada Fase es un PR independiente con su propio retro en docs/feature_retros/.
- Ninguna Fase toca archivos fuera de su scope listado.
- CLAUDE.md se actualiza en cada Fase con conteo de tests, lista de suites nuevas y priorities tachadas cuando aplica.
- Ninguna Fase rompe el flujo del owner — ventas viejas migradas se ven correctas.
- La migración corre automáticamente al abrir la app después de actualizar; el usuario no hace nada.
- Sin @testing-library/react-native.
- Sin Co-Authored-By ni Generated with Claude Code.

---

## Verification

Fase A:
1. npm test — 0 fallos, ~25-35 tests nuevos.
2. Manual: app arranca con ventas viejas (v2) → migración corre → SaleDetail muestra las ventas viejas correctas vía shim.
3. Manual: cobrar 3 productos en un solo checkout → Ventas muestra 1 sola fila con 1 orderNumber.
4. Verificar en AsyncStorage (log): ventasv_sales_schema_version === '3' y cada sale tiene items[].

Fase B:
1. npm test — 0 fallos.
2. Manual: cobrar 3 productos → SaleDetail muestra los 3 con extras, sizes, quantities individuales.
3. Manual: Ventas muestra resumen tipo "3 productos" en la fila.
4. Manual: Comandas muestra 1 comanda con 3 ítems. CookModal marca cada unidad.
5. grep -rn en el PR description sin matches fuera de salesMigration.js.

Fase C:
1. npm test — 0 fallos.
2. Manual: imprimir ticket multi-producto → 1 ticket con todos los items, total único.
3. Manual: WhatsApp con multi-producto → 1 mensaje con todos los items.
4. Manual: transferencia multi-producto → mensaje con items + info bancaria.
