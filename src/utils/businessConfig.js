import AsyncStorage from '@react-native-async-storage/async-storage';

const BANK_KEY = 'business_bank_config';
const WA_KEY = 'business_whatsapp';
const KITCHEN_KEY = 'business_kitchen_whatsapp';

export const saveBankConfig = async (config) => {
  await AsyncStorage.setItem(BANK_KEY, JSON.stringify(config));
};

export const loadBankConfig = async () => {
  const raw = await AsyncStorage.getItem(BANK_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const saveWhatsAppNumber = async (number) => {
  await AsyncStorage.setItem(WA_KEY, number);
};

export const loadWhatsAppNumber = async () => {
  return await AsyncStorage.getItem(WA_KEY);
};

export const saveKitchenNumber = async (number) => {
  await AsyncStorage.setItem(KITCHEN_KEY, number);
};

export const loadKitchenNumber = async () => {
  return await AsyncStorage.getItem(KITCHEN_KEY);
};

export const buildKitchenMessage = (sale) => {
  const lines = [
    `🎫 *PEDIDO #${sale.orderNumber || sale.id?.slice(-4) || '----'}*`,
    ``,
    `🍽️ *${sale.productName}*`,
    `📏 Tamaño: ${sale.size}`,
    `🔢 Cantidad: ${sale.quantity}x`,
    sale.toppings?.length
      ? `✨ Extras:\n${sale.toppings.map(t => `   • ${t}`).join('\n')}`
      : null,
    sale.units?.length
      ? `\n🧩 Unidades:\n${sale.units.map((u, i) =>
          `   ${i + 1}. ${u.flavors?.map(f => f.name).join(' + ') || ''}${u.toppings?.length ? ' + ' + u.toppings.join(', ') : ''}`
        ).join('\n')}`
      : null,
    ``,
    `👤 Cajero: ${sale.workerName}`,
    `⏰ ${new Date(sale.timestamp).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}`,
    ``,
    `✅ *PREPARAR YA*`,
  ].filter(Boolean);
  return encodeURIComponent(lines.join('\n'));
};

export const buildTicketMessage = (sale) => {
  const methods = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' };
  const lines = [
    `🎫 *Tu pedido #${sale.orderNumber || sale.id?.slice(-4) || '----'}*`,
    ``,
    `*${sale.productName}*`,
    `${sale.size} × ${sale.quantity}`,
    sale.toppings?.length
      ? `✨ Extras: ${sale.toppings.join(', ')}`
      : null,
    ``,
    `💰 Total: $${sale.total?.toFixed(2)}`,
    `💳 Pago: ${methods[sale.paymentMethod] || sale.paymentMethod}`,
    ``,
    `✅ ¡Gracias! Tu pedido está en preparación.`,
  ].filter(Boolean);
  return encodeURIComponent(lines.join('\n'));
};

export const buildTransferMessage = (order, bankConfig) => {
  const lines = [
    `🎫 *Pedido #${order.orderNumber || order.id?.slice(-4) || '----'}*`,
    ``,
    `*${order.productName || order.product?.name}*`,
    `${order.size?.name || order.size} × ${order.quantity}`,
    ``,
    `💰 Total: $${order.total?.toFixed(2)}`,
    ``,
    `🏦 Datos para transferir:`,
    `Banco: ${bankConfig.bank}`,
    `Titular: ${bankConfig.holder}`,
    `Cuenta: ${bankConfig.account}`,
    ``,
    `Enviá tu comprobante al responder este mensaje.`,
  ].filter(Boolean);
  return encodeURIComponent(lines.join('\n'));
};