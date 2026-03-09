import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const generateTicketHTML = (sale, orderDetails) => {
  const date = new Date(sale.timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const timeStr = `${hour12}:${minutes} ${ampm}`;

  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const dateStr = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;

  const toppingsHTML = sale.toppings && sale.toppings.length > 0
    ? sale.toppings.map(t => `
        <div style="font-size: 28px; padding: 4px 0 4px 20px; color: #333;">
          + ${t}
        </div>
      `).join('')
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          width: 280px;
          padding: 16px;
          background: #fff;
          color: #000;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider {
          border-top: 2px dashed #000;
          margin: 12px 0;
        }
        .divider-thick {
          border-top: 3px solid #000;
          margin: 12px 0;
        }
        .header {
          text-align: center;
          padding-bottom: 8px;
        }
        .store-name {
          font-size: 36px;
          font-weight: 900;
          letter-spacing: 4px;
        }
        .ticket-label {
          font-size: 20px;
          color: #666;
          margin-top: 4px;
          letter-spacing: 2px;
        }
        .order-number {
          font-size: 52px;
          font-weight: 900;
          text-align: center;
          padding: 12px 0;
          letter-spacing: 2px;
        }
        .product-section {
          padding: 8px 0;
        }
        .product-name {
          font-size: 34px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .product-size {
          font-size: 28px;
          font-weight: bold;
          margin-top: 6px;
          padding: 4px 8px;
          background: #f0f0f0;
          display: inline-block;
          border-radius: 4px;
        }
        .quantity-badge {
          font-size: 32px;
          font-weight: 900;
          text-align: center;
          padding: 8px;
          margin: 8px 0;
          border: 3px solid #000;
          border-radius: 8px;
        }
        .toppings-title {
          font-size: 22px;
          font-weight: bold;
          color: #666;
          margin-top: 8px;
          letter-spacing: 2px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 22px;
          padding: 3px 0;
          color: #555;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 32px;
          font-weight: 900;
          padding: 8px 0;
        }
        .payment-method {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          padding: 6px 12px;
          border: 2px solid #000;
          border-radius: 6px;
          display: inline-block;
          margin: 0 auto;
        }
        .footer {
          text-align: center;
          font-size: 18px;
          color: #999;
          margin-top: 8px;
        }
        .prep-notice {
          text-align: center;
          font-size: 26px;
          font-weight: 900;
          padding: 10px;
          margin: 8px 0;
          border: 3px solid #000;
          background: #000;
          color: #fff;
          letter-spacing: 2px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">VENTA</div>
        <div class="ticket-label">TICKET DE PEDIDO</div>
      </div>

      <div class="divider-thick"></div>

      <div class="order-number">#${sale.id.slice(-4)}</div>

      <div class="divider"></div>

      <div class="product-section">
        <div class="product-name">${sale.productName}</div>
        <div class="product-size">${sale.size}</div>
      </div>

      <div class="quantity-badge">CANTIDAD: ${sale.quantity}</div>

      ${sale.toppings && sale.toppings.length > 0 ? `
        <div class="toppings-title">EXTRAS:</div>
        ${toppingsHTML}
        <div style="height: 6px;"></div>
      ` : ''}

      <div class="divider-thick"></div>

      <div class="prep-notice">→ PREPARAR ←</div>

      <div class="divider"></div>

      <div class="total-row">
        <span>TOTAL</span>
        <span>$${sale.total.toFixed(2)}</span>
      </div>

      <div class="center">
        <div class="payment-method">
          ${sale.paymentMethod === 'cash' ? '💵 EFECTIVO' : '💳 TARJETA'}
        </div>
      </div>

      <div class="divider"></div>

      <div class="info-row">
        <span>Fecha</span>
        <span>${dateStr}</span>
      </div>
      <div class="info-row">
        <span>Hora</span>
        <span>${timeStr}</span>
      </div>
      <div class="info-row">
        <span>Cajero</span>
        <span>${sale.workerName || '—'}</span>
      </div>

      <div class="divider"></div>

      <div class="footer">
        Gracias por tu compra<br>
        ID: ${sale.id}
      </div>
    </body>
    </html>
  `;
};

export const printTicket = async (sale) => {
  try {
    const html = generateTicketHTML(sale);
    await Print.printAsync({
      html,
      width: 280,
    });
    return { success: true };
  } catch (e) {
    console.log('Print error:', e);
    return { error: e.message };
  }
};

export const shareTicket = async (sale) => {
  try {
    const html = generateTicketHTML(sale);
    const { uri } = await Print.printToFileAsync({
      html,
      width: 280,
      height: 600,
    });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Ticket #${sale.id.slice(-4)}`,
    });
    return { success: true };
  } catch (e) {
    console.log('Share error:', e);
    return { error: e.message };
  }
};