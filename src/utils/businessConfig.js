import AsyncStorage from '@react-native-async-storage/async-storage';

const BANK_KEY = 'business_bank_config';
const WA_KEY = 'business_whatsapp';

// ─── BANCO ───────────────────────────────────────────
export const saveBankConfig = async (config) => {
  await AsyncStorage.setItem(BANK_KEY, JSON.stringify(config));
};

export const loadBankConfig = async () => {
  const raw = await AsyncStorage.getItem(BANK_KEY);
  return raw ? JSON.parse(raw) : null;
};

// ─── WHATSAPP DEL NEGOCIO ────────────────────────────
export const saveWhatsAppNumber = async (number) => {
  await AsyncStorage.setItem(WA_KEY, number);
};

export const loadWhatsAppNumber = async () => {
  return await AsyncStorage.getItem(WA_KEY);
};

// ─── HELPERS DE MENSAJES ────────────────────────────
export const buildTransferMessage = (order, bankConfig) => {
  const lines = [
    `🧾 *Pedido #${order.id?.slice(-4) || '----'}*`,
    ``,
    `📦 ${order.productName || order.product?.name}`,
    `   ${order.size?.name || order.size} × ${order.quantity}`,
    ``,
    `💰 *Total: $${order.total?.toFixed(2)}*`,
    ``,
    `──────────────────`,
    `🏦 *Datos para transferencia:*`,
    `Banco: ${bankConfig.bank}`,
    `Titular: ${bankConfig.holder}`,
    `Cuenta: ${bankConfig.account}`,
    `──────────────────`,
    `Por favor enviá tu comprobante al responder este mensaje ✅`,
  ];
  return encodeURIComponent(lines.join('\n'));
};

export const buildTicketMessage = (sale) => {
  const methods = { cash: '💵 Efectivo', card: '💳 Tarjeta', transfer: '🏦 Transferencia' };
  const lines = [
    `🧾 *Ticket #${sale.id?.slice(-4) || '----'}*`,
    ``,
    `📦 ${sale.productName}`,
    `   ${sale.size} × ${sale.quantity}`,
    sale.toppings?.length ? `   Extras: ${sale.toppings.join(', ')}` : null,
    ``,
    `💰 *Total: $${sale.total?.toFixed(2)}*`,
    `   Pago: ${methods[sale.paymentMethod] || sale.paymentMethod}`,
    ``,
    `✅ ¡Gracias por tu compra!`,
  ].filter(Boolean);
  return encodeURIComponent(lines.join('\n'));
};