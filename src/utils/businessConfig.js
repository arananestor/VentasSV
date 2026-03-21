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

// Mensaje para cocina — claro y directo, sin adornos
export const buildKitchenMessage = (sale) => {
  const lines = [
    `*PEDIDO #${sale.id?.slice(-4) || '----'}*`,
    ``,
    `*${sale.productName}*`,
    `Tamaño: ${sale.size}`,
    `Cantidad: ${sale.quantity}x`,
    sale.toppings?.length ? `Extras: ${sale.toppings.join(', ')}` : null,
    ``,
    `Total: $${sale.total?.toFixed(2)}`,
  ].filter(Boolean);
  return encodeURIComponent(lines.join('\n'));
};

// Mensaje para cliente — con detalle completo
export const buildTicketMessage = (sale) => {
  const methods = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' };
  const lines = [
    `*Pedido #${sale.id?.slice(-4) || '----'}*`,
    ``,
    `*${sale.productName}*`,
    `${sale.size} × ${sale.quantity}`,
    sale.toppings?.length ? `Extras: ${sale.toppings.join(', ')}` : null,
    ``,
    `*Total: $${sale.total?.toFixed(2)}*`,
    `Pago: ${methods[sale.paymentMethod] || sale.paymentMethod}`,
    ``,
    `Gracias por tu compra`,
  ].filter(Boolean);
  return encodeURIComponent(lines.join('\n'));
};

export const buildTransferMessage = (order, bankConfig) => {
  const lines = [
    `*Pedido #${order.id?.slice(-4) || '----'}*`,
    ``,
    `*${order.productName || order.product?.name}*`,
    `${order.size?.name || order.size} × ${order.quantity}`,
    ``,
    `*Total: $${order.total?.toFixed(2)}*`,
    ``,
    `Datos para transferir:`,
    `Banco: ${bankConfig.bank}`,
    `Titular: ${bankConfig.holder}`,
    `Cuenta: ${bankConfig.account}`,
    ``,
    `Enviá tu comprobante al responder este mensaje.`,
  ].filter(Boolean);
  return encodeURIComponent(lines.join('\n'));
};