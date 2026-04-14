import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateBusinessConfigToQentasFields } from './businessConfigMigration';

const BANK_KEY = 'business_bank_config';
const WA_KEY = 'business_whatsapp';

export const saveBankConfig = async (config) => {
  await AsyncStorage.setItem(BANK_KEY, JSON.stringify(config));
};

export const loadBankConfig = async () => {
  const raw = await AsyncStorage.getItem(BANK_KEY);
  if (!raw) return null;
  const config = JSON.parse(raw);
  const migrated = migrateBusinessConfigToQentasFields(config);
  if (migrated.qentasConnected !== config.qentasConnected || migrated.qentasAccountId !== config.qentasAccountId) {
    await AsyncStorage.setItem(BANK_KEY, JSON.stringify(migrated));
  }
  return migrated;
};

export const saveWhatsAppNumber = async (number) => {
  await AsyncStorage.setItem(WA_KEY, number);
};

export const loadWhatsAppNumber = async () => {
  return await AsyncStorage.getItem(WA_KEY);
};

export const buildItemLines = (item) => {
  const lines = [
    `*${item.productName || ''}*`,
    `${item.size || ''} × ${item.quantity || 1} — $${(item.subtotal || 0).toFixed(2)}`,
  ];
  const extras = item.extras || [];
  if (extras.length > 0) {
    lines.push(`✨ Extras: ${extras.map(e => typeof e === 'string' ? e : e.name || '').join(', ')}`);
  }
  if (item.note) {
    lines.push(`📝 ${item.note}`);
  }
  return lines;
};

export const buildTicketMessage = (sale) => {
  const methods = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' };
  const items = sale.items || [];
  const itemLines = items.flatMap((item, i) => {
    const lines = buildItemLines(item);
    if (i < items.length - 1) lines.push('');
    return lines;
  });
  const lines = [
    `🎫 *Tu pedido #${sale.orderNumber || sale.id?.slice(-4) || '----'}*`,
    ``,
    ...itemLines,
    ``,
    `💰 Total: $${sale.total?.toFixed(2)}`,
    `💳 Pago: ${methods[sale.paymentMethod] || sale.paymentMethod}`,
    ``,
    `✅ ¡Gracias! Tu pedido está en preparación.`,
  ].filter(l => l != null);
  return encodeURIComponent(lines.join('\n'));
};

export const buildTransferMessage = (order, bankConfig) => {
  const items = order.items || [];
  const itemLines = items.flatMap((item, i) => {
    const lines = buildItemLines(item);
    if (i < items.length - 1) lines.push('');
    return lines;
  });
  const lines = [
    `🎫 *Pedido #${order.orderNumber || order.id?.slice(-4) || '----'}*`,
    ``,
    ...itemLines,
    ``,
    `💰 Total: $${order.total?.toFixed(2)}`,
    ``,
    `🏦 Datos para transferir:`,
    bankConfig?.bank ? `Banco: ${bankConfig.bank}` : null,
    bankConfig?.holder ? `Titular: ${bankConfig.holder}` : null,
    bankConfig?.account ? `Cuenta: ${bankConfig.account}` : null,
    ``,
    `Enviá tu comprobante al responder este mensaje.`,
  ].filter(l => l != null);
  return encodeURIComponent(lines.join('\n'));
};